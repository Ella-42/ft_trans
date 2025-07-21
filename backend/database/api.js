import sqlite3 from 'sqlite3';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const { Database } = sqlite3;
const domain = process.env.domain;
const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, '\n');

const dbPath = '/var/www/db/pong.sqlite';
const hmacPath = '/var/www/db/.HMAC.env';
if (!fs.existsSync(dbPath)) {
	try {
		fs.writeFileSync(hmacPath, crypto.randomBytes(32).toString('hex'));
	} catch(error) {
		console.error('Failed to generate new HMAC key:', error);
	}
}
const hmac = fs.readFileSync(hmacPath, 'utf8');

// Initialize SQLite database
const db = new Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    }
    else {
        console.log('Connected to SQLite database');
        db.run("PRAGMA foreign_keys = ON;");
    }
});

// Ensure the database exists
db.serialize(() => {
    db.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL UNIQUE,
            password TEXT,
            email TEXT NOT NULL UNIQUE,
            verified INT DEFAULT FALSE,
            friends TEXT DEFAULT '[]',
            blocked TEXT DEFAULT '[]',
            pong_wins INT DEFAULT 0,
            pong_losses INT DEFAULT 0,
            pong_tournament_wins INT DEFAULT 0,
            avatar TEXT DEFAULT NULL
        );

        CREATE TABLE IF NOT EXISTS matches (
            time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            game TEXT NOT NULL,
            winner INTEGER NOT NULL,
            loser INTEGER NOT NULL,
            info TEXT,
            FOREIGN KEY (winner) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (loser) REFERENCES users(id) ON DELETE CASCADE
        );
    `, (err) => {
        if (err) console.error('Error creating tables:', err.message);
        else console.log('Tables created successfully');
    });
});

// **Helper Function to Promisify SQLite Queries**
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

function createInstance() {
	return Fastify({
		logger: true
	})
}

function registerCors(instance) {
	return instance.register(fastifyCors, {
		origin: (origin, cb) => {
			const allowedOrigins = [`https://${domain}`, 'https://localhost'];
			if (!origin || allowedOrigins.includes(origin)) {
				cb(null, true);
			} else {
				cb(new Error('Not allowed'), false);
			}
		},
		credentials: true,
		methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
	});
}

function registerCookie(instance) {
	return instance.register(fastifyCookie, {
		secret: process.env.COOKIE_SECRET, // for signed cookies
		parseOptions: {} // options for parsing
	});
}

const fastify = createInstance();
const internalFastify = createInstance();

await registerCors(fastify);
await registerCors(internalFastify);

await registerCookie(fastify);
await registerCookie(internalFastify);

// **Regex***

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
const nicknameRegex = /^[\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0400-\u04FF\u1F00-\u1FFF]+$/;

// **Mail**

const mail = async (to, token, endpoint) => {
	const response = await fetch(`http://mailserver:2626/${endpoint}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			to,
			token
		})
	});
	if (!response.ok) console.error(`Mailserver failed: ${response.status}: ${(await response.json()).error}`);
}

const autoClose = (wording, reply) => {
	reply.type('text/html').send(`<h2 align="center">Email ${wording} successfully!</h2><script>setTimeout(() => window.close(), 3000);</script>`);
}

// **Token handlers**

const jwtSend = (id, reply) => {
	const token = jwt.sign({ id }, privateKey, { algorithm: 'RS256', expiresIn: '12h' });
	reply.setCookie('token', token, {
		signed: true,
		httpOnly: true,
		secure: true,
		sameSite: 'Strict',
		path: '/',
		maxAge: 60 * 60 * 12 // 12 hours
	}).send({ ok: true });
}

const decode = async (request, reply) => {
	const { token } = request.query;
	if (!token) return reply.status(401).send({ error: 'Unauthorized: No token provided' });
	try {
		request.decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
	} catch {
		return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
	}
}

const verifyToken = async (request, reply) => {
    try {
        if (!request.cookies.token) {
            return reply.status(401).send({ error: 'Unauthorized: No token cookies provided' });
        }
        const token = request.unsignCookie(request.cookies.token);
        if (!token.valid) {
            return reply.status(401).send({ error: 'Unauthorized: Invalid cookie signature' });
        }
        if (!token.value) return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
        const decoded = jwt.verify(token.value, publicKey, { algorithms: ['RS256'] });
        const user = await dbGet('SELECT id FROM users WHERE id = ?', [decoded.id]);
        if (!user) return reply.status(401).send({ error: 'Unauthorized: User not found' });
        request.user = decoded;
        return true;
    } catch (err) {
        console.error("Token verification failed");
        return reply.status(401).send({ error: 'Invalid token' });
    }
};

function checkLoginInStatus(request, reply, done) {
    if (!request.cookies.token) {
        request.user = null;
        return done();
    }
    const token = request.unsignCookie(request.cookies.token);
    if (!token.valid) {
          return reply.status(401).send({ error: 'Unauthorized: Invalid cookie signature' });
    }

    if (!token.value) {
      request.user = null;
      return done();
    }

    jwt.verify(token.value, publicKey, { algorithms: ['RS256'] }, (err, user) => {
      if (err) {
        request.user = null;
      } else {
        request.user = user;
      }
      done();
    });
}

fastify.get('/api/users/verifytoken', { preHandler: verifyToken }, async (request, reply) => {
    try { 
        const user = await dbGet('SELECT id, nickname FROM users WHERE id = ?', [request.user.id]);
        if (!user) return reply.status(401).send({ error: 'Unauthorized: User not found' });
        reply.status(200).send({ message: 'OK', id: user.id, nickname: user.nickname });
        return ;
    } catch (err) {
        reply.status(500).send({ error: 'Failed to verify' });
    }
});

fastify.get('/api/verify', { preHandler: decode }, async (request, reply) => {
	try {
		await dbRun('UPDATE users SET verified = TRUE WHERE email = ?', [request.decoded.hashedEmail]);
	} catch {
		return reply.status(500).send({ error: 'Failed to verify email' });
	}
	autoClose('verified', reply);
});

fastify.get('/api/update', { preHandler: decode }, async (request, reply) => {
	try {
		await dbRun('UPDATE users SET email = ? WHERE email = ?', [request.decoded.newMail, request.decoded.oldMail]);
	} catch {
		return reply.status(500).send({ error: 'Failed to update email' });
	}
	autoClose('updated', reply);
});

// **1. Fetch all users**
fastify.get('/api/users', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const users = await dbAll('SELECT id, nickname FROM users');
        reply.send(users);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch users' });
    }
});

// **2. Fetch user by ID**
fastify.get('/api/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await dbGet('SELECT id, nickname FROM users WHERE id = ?', [id]);
        if (!user) return reply.status(404).send({ error: 'User not found' });
        reply.send(user);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch users' });
    }
});

function isEmptyOrNull(str) {
    return str === null || str === "" || str === undefined;
};

const hash = async variable => {
	return await bcrypt.hash(variable, 11);
}

const hmacHash = variable => {
	return crypto.createHmac('sha256', hmac).update(variable).digest('hex');
}

// **3. Add new user**
fastify.post('/api/register', async (request, reply) => {
    try {
        const { name, email, password } = request.body;
        if (isEmptyOrNull(email)) return reply.status(400).send({ error: 'Email is required' });
        if (isEmptyOrNull(password)) return reply.status(400).send({ error: 'Password is required' });
        if (isEmptyOrNull(name)) return reply.status(400).send({ error: 'Nickname is required' });
        if (!emailRegex.test(email)) {
            return reply.status(400).send({ error: 'Invalid email format' });
        }
        if (!passwordRegex.test(password)) {
			return reply.status(400).send({ error: 'Password must contain at least 1 uppercase and 1 lowercase letter, 1 digit, 1 special character and be at least 8 characters long' });
        }
        if (!nicknameRegex.test(name)) {
            return reply.status(400).send({ error: 'Nickname can only contain printable characters' });
        }
		const hashedEmail = hmacHash(email);
        const result = await dbRun('INSERT INTO users (nickname, email, password) VALUES (?, ?, ?)', [name, hashedEmail, await hash(password)]);
        reply.status(201).send({ id: result.lastID, name });
		const mailToken = jwt.sign({ hashedEmail }, privateKey, { algorithm: 'RS256', expiresIn: '15m' });
		await mail(email, mailToken, 'verify');
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return reply.status(400).send({ error: 'Email or nickname is already in use' });
        }
        reply.status(500).send({ error: 'Failed to add user' });
    }
});

// **3.5 Add new Google user or log in**
internalFastify.post('/api/google_register', async (request, reply) => {
	let result;
	const { name, email, picture } = request.body;
	const hashedEmail = hmacHash(email);
    try {
		result = await dbRun('INSERT INTO users (nickname, email, verified, avatar) VALUES (?, ?, TRUE, ?)', [name, hashedEmail, picture]);
	} catch (err) {
		if (err.code === 'SQLITE_CONSTRAINT') {
			if (err.message.includes('users.nickname')) {
				const row = await dbGet('SELECT id FROM users ORDER BY id DESC LIMIT 1');
				try {
					result = await dbRun('INSERT INTO users (nickname, email, verified, avatar) VALUES (?, ?, TRUE, ?)', ['user' + (row.id + 1), hashedEmail, picture]);
				} catch (err) {
					return reply.status(500).send({ error: 'Try signing in with another account registered to a different name' });
				}
			}
			result = await dbGet('SELECT id FROM users WHERE email = ?', [hashedEmail]);
			result.lastID = result.id; //make user log in instead
		}
		else return reply.status(500).send({ error: 'Failed to add user' });
	}
	try {
		jwtSend(result.lastID, reply);
	} catch (err) {
		reply.status(500).send({ error: 'Failed to set cookie' });
	}
});

// **4. Update user**
fastify.put('/api/users/:id', { preHandler: verifyToken }, async (request, reply) => {
	try {
		const { id } = request.params;
		if (parseInt(id) !== request.user.id)
			return reply.status(403).send({ error: 'Forbidden: You can only modify your own profile' });
		const { name, avatar, email, password, oldPassword } = request.body;
		const user = await dbGet('SELECT email, password FROM users WHERE id = ?', [id]);
		if (!user) return reply.status(404).send({ error: 'User not found' });
		if (user.password) {
			if (isEmptyOrNull(oldPassword))
				return reply.status(400).send({ error: 'Old password required' });
			if (!await bcrypt.compare(oldPassword, user.password))
				return reply.status(400).send({ error: 'Incorrect old password' });
		}
		if (isEmptyOrNull(name) && isEmptyOrNull(avatar) && isEmptyOrNull(email) && isEmptyOrNull(password))
			return reply.status(400).send({ error: 'No fields provided' });

		const fields = [];
		const params = [];
		if (!isEmptyOrNull(name)) {
			if (!nicknameRegex.test(name))
				return reply.status(400).send({ error: 'Nickname can only contain printable characters' });
			fields.push('nickname = ?');
			params.push(name);
		}
        if (!isEmptyOrNull(avatar)) {
			fields.push('avatar = ?');
			params.push(avatar);
        }
		if (!isEmptyOrNull(password)) {
			if (!passwordRegex.test(password))
				return reply.status(400).send({ error: 'Password must contain at least 1 uppercase and 1 lowercase letter, 1 digit, 1 special character and be at least 8 characters long' });
			fields.push('password = ?');
			params.push(await bcrypt.hash(password, 11));
		}
		if (fields.length)
			await dbRun(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
		if (!isEmptyOrNull(email)) {
			if (!emailRegex.test(email))
				return reply.status(400).send({ error: 'Invalid email format' });
			reply.status(200).send({ message: 'User updated successfully, note: New email has to be verified before it can be updated' });
			const mailToken = jwt.sign({ oldMail: user.email, newMail: hmacHash(email) }, privateKey, { algorithm: 'RS256', expiresIn: '15m' });
			return await mail(email, mailToken, 'update');
		}
		reply.status(200).send({ message: 'User updated successfully' });
	} catch {
		reply.status(500).send({ error: 'Failed to update user' });
	}
});

// **5. Get Avatar**
fastify.get('/api/users/:id/avatar', async (request, reply) => {
    try {
        const { id } = request.params;
        const row = await dbGet("SELECT avatar FROM users WHERE id = ?", [id]);
        if (!row) {
            return reply.status(404).send({ error: "User not found" });
        }
        const avatar = row.avatar ? row.avatar : "https://42.fr/wp-content/uploads/2021/05/42-Final-sigle-seul.svg";
        reply.send({avatar: avatar});
        return ;
    } catch (err) {
        reply.status(500).send({ error: 'Failed to retrieve avatar' });
    }
});

// **6. Delete user**
fastify.delete('/api/users/:id', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only delete your own profile' });
        }
        const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);

        if (result.changes === 0) return reply.status(404).send({ error: 'User not found' });

        reply.status(200).send({ message: 'User deleted successfully' });
    } catch (err) {
        reply.status(500).send({ error: 'Failed to delete user' });
    }
});

// **7.  login user**
fastify.post('/api/login', async (request, reply) => {
    const { email, password } = request.body;
    try {
        const user = await dbGet('SELECT id, email, password, verified FROM users WHERE email = ?', [hmacHash(email)]);
        if (!user) {
            return reply.status(401).send({ error: 'Invalid email' });
        }
        if (!await bcrypt.compare(password, user.password)) {
            return reply.status(401).send({ error: 'Invalid password' });
        }
		if (!user.verified) return reply.status(401).send({ error: 'Unverified email' });
		jwtSend(user.id, reply);
    } catch (err) {
        reply.status(500).send({ error: 'An error occurred while logging in' });
    }
});

// **8. add friend **

fastify.put('/api/users/:id/friends', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only modify your own profile' });
        }
        const { friendid } = request.body;

        if (id == friendid) {
            return reply.status(204).send({ message: 'No changes made' });
        }
        // Check if user exists before updating
        const existingUser = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
        if (!existingUser) return reply.status(404).send({ error: 'User not found' });

        const existingfriend = await dbGet('SELECT id FROM users WHERE id = ?', [friendid]);
        if (!existingfriend) return reply.status(404).send({ error: 'Friend not found' });

        // Perform the update
        const row = await dbGet("SELECT friends FROM users WHERE id = ?", [id]);
        if (!row) {
            return reply.status(404).send({ error: "User not found" });
        }
        let jsonArray = JSON.parse(row.friends);
        if (jsonArray.includes(friendid)) {
            console.log("Friend already on friend list");
            return reply.status(200).send({ message: 'Friend already on friends list' });
        }
        jsonArray.push(friendid);
        const result = await dbRun("UPDATE users SET friends = ? WHERE id = ?", [JSON.stringify(jsonArray), id]);
        if (!result.changes) return reply.status(204).send({ message: 'No changes made' });
        reply.status(200).send({ message: 'Friends list updated successfully' });
        return ;
    } catch (err) {
        reply.status(500).send({ error: 'Failed to update friends list.' });
    }
});

// **9. get friends list **

fastify.get('/api/users/:id/friends', async (request, reply) => {
    try {
        const { id } = request.params;
        const row = await dbGet("SELECT friends FROM users WHERE id = ?", [id]);
        if (!row) {
            return reply.status(404).send({ error: "User not found" });
        }
        const friends = JSON.parse(row.friends);
        reply.send(friends);
        return ;
    } catch (err) {
        reply.status(500).send({ error: 'Failed to retrieve friends list.' });
    }
});

// **10. delete friend from friends list
fastify.delete('/api/users/:id/friends', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only modify your own profile' });
        }
        const { friendid } = request.body;
        const row = await dbGet("SELECT friends FROM users WHERE id = ?", [id]);
        if (!row) {
            return reply.status(404).send({ error: "User not found" });
        }
        let jsonArray = JSON.parse(row.friends);
        if (!jsonArray.includes(String(friendid))) {
            console.log("Friend not on friends list: ", friendid);
            return reply.status(200).send({ message: 'Friend not on friends list' });
        }
        jsonArray = jsonArray.filter(item => item !== String(friendid)); // Remove item
        const result = await dbRun("UPDATE users SET friends = ? WHERE id = ?", [JSON.stringify(jsonArray), id]);
        if (!result.changes) return reply.status(204).send({ message: 'No changes made' });
        console.log("Friend deleted");
        reply.status(200).send({ message: 'Friends list updated successfully' });
        return ;
    } catch (err) {
        reply.status(500).send({ error: 'Failed to retrieve friends list.' });
    }
});

// ** 11. Get current user name
fastify.get('/api/whoami', { preHandler: checkLoginInStatus }, async (request, reply) => {
    try {
        if (!request.user) {
            return reply.send({ nickname: "guest", id: -1 });
        }
        const id = request.user.id;
        const user = await dbGet('SELECT nickname FROM users WHERE id = ?', [id]);
        if (!user) {
            return reply.send({ nickname: "guest", id: -1 });
        }
        return reply.send({ nickname: user.nickname, id: id });
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch username' });
    }
});

// ** 12. Logout
fastify.post('/api/logout', async (request, reply) => {
    reply.clearCookie('token', {
        path: '/'
    }).send({ ok: true });
});


// ** 13. Match history

fastify.get('/api/users/:id/history', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        const page = parseInt(request.query.page) || 1;       // default page 1
        const limit = parseInt(request.query.limit) || 25;     // default 25 per page
        const offset = (page - 1) * limit;    // go to the correct starting entry in db.
        const total = await dbGet(
            'SELECT COUNT(*) AS count FROM matches WHERE winner = ? OR loser = ?', [id, id]
        );    // Total number of history.

        const matches = await dbAll(
          'SELECT * FROM matches WHERE winner = ? OR loser = ? ORDER BY time DESC LIMIT ? OFFSET ?', [id, id, limit, offset]
        );

        const matchesWithNick = [];
        for (const match of matches) {
          const winner = await dbGet(
            'SELECT nickname FROM users WHERE id = ?', [match.winner]
          );
          const loser = await dbGet(
            'SELECT nickname FROM users WHERE id = ?', [match.loser]
          );
          matchesWithNick.push({
            ...match,
            winner: {
              id: match.winner,
              nickname: winner ? winner.nickname : 'Deleted user'
            },
            loser: {
              id: match.loser,
              nickname: loser ? loser.nickname : 'Deleted user'
            }
          });
        }
        reply.status(200).send({
            totalCount: total.count,
            currentPage: page,
            limit,
            totalPages: Math.ceil(total.count / limit),
            results: matchesWithNick });

    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch match history' });
    }
});

// **13.1 Fetch user pong's wins and losses by ID**
fastify.get('/api/users/:id/pong', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await dbGet('SELECT id, nickname, pong_wins, pong_losses FROM users WHERE id = ?', [id]);
        if (!user) return reply.status(404).send({ error: 'User not found' });
        reply.send(user);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch users' });
    }
});

// **13.2 Update game history**

const VALID_GAMES = ["pong"];

internalFastify.post('/api/updateResult', async (request, reply) => {
  try {
    const { winId, lossId, game } = request.body;
    if (!Number.isInteger(winId) || !Number.isInteger(lossId)) {
      throw new Error("Invalid user ID");
    }
    if (!VALID_GAMES.includes(game)) {
      throw new Error("Invalid game");
    }
    const win = await dbRun(`UPDATE users SET ${game}_wins = ${game}_wins + 1 WHERE id = ?`, [winId]);
    const loss =  await dbRun(`UPDATE users SET ${game}_losses = ${game}_losses + 1 WHERE id = ?`, [lossId]);
    const history = await dbRun('INSERT INTO matches (game, winner, loser) VALUES (?, ?, ?)', [game, winId, lossId]);
    if (!win.changes  || !loss.changes || !history.changes) return reply.status(204).send({ message: 'Some changes are not made' });
    reply.status(200).send({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Failed to update user' });
  }
});

fastify.get('/api', async () => `This is the ${domain}'s API`);

fastify.listen({ host: '0.0.0.0', port: 3443 }, err => {
    if (err) throw err;
    console.log(`Server running on https://${domain}/api`);
});

internalFastify.listen({ host: '0.0.0.0', port: 4334 }, err => {
    if (err) throw err;
    console.log(`Internal server running locally on port 4334`);
});
