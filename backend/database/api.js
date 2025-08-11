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
            two_factor INT DEFAULT FALSE,
            friend_requests TEXT DEFAULT '[]',
            friends TEXT DEFAULT '[]',
            pong_wins INT DEFAULT 0,
            pong_losses INT DEFAULT 0,
            pong_tournament_wins INT DEFAULT 0,
            avatar TEXT DEFAULT NULL,
            active INT DEFAULT NULL
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
	reply.type('text/html').send(`<h2 align="center">${wording} successfully!</h2><script>setTimeout(() => window.close(), 3000);</script>`);
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
        const user = await dbGet('SELECT id, nickname, avatar FROM users WHERE id = ?', [request.user.id]);
        if (!user) return reply.status(401).send({ error: 'Unauthorized: User not found' });
        reply.status(200).send({ message: 'OK', id: user.id, nickname: user.nickname, avatar: user.avatar });
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
	autoClose('Email verified', reply);
});

fastify.get('/api/update', { preHandler: decode }, async (request, reply) => {
	try {
		await dbRun('UPDATE users SET email = ? WHERE email = ?', [request.decoded.newMail, request.decoded.oldMail]);
	} catch {
		return reply.status(500).send({ error: 'Failed to update email' });
	}
	autoClose('Email updated', reply);
});

// **1. Fetch user by search for nickname**
fastify.get('/api/users/search', { preHandler: verifyToken }, async (request, reply) => {
	const query = request.query.q;
	if (typeof query !== 'string')
		return reply.status(400).send({ error: 'Invalid query format, has to be string' });
	if (query.length < 3)
		return reply.status(400).send({ error: 'Invalid query length, has to be at least 3 characters' });

	try {
		return await dbAll(`SELECT id, nickname, avatar FROM users WHERE LOWER(nickname) LIKE LOWER(?) LIMIT 25`, [`%${query}%`]);
	} catch {
		reply.status(500).send({ error: 'Failed to fetch user(s)' });
	}
});

// **1.1 Fetch all users**
internalFastify.get('/api/users', async (request, reply) => {
	try {
		reply.send(await dbAll('SELECT id, nickname, avatar FROM users'));
	} catch (err) {
		reply.status(500).send({ error: 'Failed to fetch users' });
	}
});

// **2. Fetch user by ID**
fastify.get('/api/users/:id', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
		if (parseInt(id) !== request.user.id && !(JSON.parse((await dbGet('SELECT friend_requests FROM users WHERE id = ?', [request.user.id])).friend_requests)).includes(id) && !(JSON.parse((await dbGet('SELECT friends FROM users WHERE id = ?', [request.user.id])).friends)).includes(id)) {
			return reply.status(403).send({ error: "You only have access to your own, those who've sent you a friend request and your friends' profiles" });
		}
        const user = await dbGet('SELECT id, nickname, avatar FROM users WHERE id = ?', [id]);
        if (!user) return reply.status(404).send({ error: 'User not found' });
        reply.send(user);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch user' });
    }
});

// **2.1 Get avatar by ID**
fastify.get('/api/users/:id/avatar', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
		if (parseInt(id) !== request.user.id && !(JSON.parse((await dbGet('SELECT friends FROM users WHERE id = ?', [request.user.id])).friends)).includes(id)) {
			return reply.status(403).send({ error: "You only have access to your own and your friends' profiles" });
		}
        const row = await dbGet("SELECT avatar FROM users WHERE id = ?", [id]);
        if (!row) {
            return reply.status(404).send({ error: "User not found" });
        }
        const avatar = row.avatar || "https://42.fr/wp-content/uploads/2021/05/42-Final-sigle-seul.svg";
        reply.send({avatar: avatar});
    } catch {
        reply.status(500).send({ error: 'Failed to retrieve avatar' });
    }
});

// **2.2 Fetch user by ID**
internalFastify.get('/api/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await dbGet('SELECT id, nickname, avatar FROM users WHERE id = ?', [id]);
        if (!user) return reply.status(404).send({ error: 'User not found' });
        reply.send(user);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch user' });
    }
});

function isEmptyOrNull(str) {
    return str === null || str === "" || str === undefined;
};

const hash = async variable => {
	return await bcrypt.hash(variable, 11);
};

const hmacHash = variable => {
	return crypto.createHmac('sha256', hmac).update(variable).digest('hex');
};

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

// **5. Update user activity**
fastify.put('/api/users/:id/ping', { preHandler: verifyToken }, async (request, reply) => {
	const { id } = request.params;
	if (parseInt(id) !== request.user.id) {
		return reply.status(403).send({ error: 'Forbidden: You can only update last active on your own profile' });
	}
	try {
		await dbRun('UPDATE users SET active = ? WHERE id = ?', [Math.floor(Date.now() / 1000), id]);
		reply.status(200).send({ message: 'Updated last active successfully' });
	} catch {
        reply.status(500).send({ error: 'Failed to update last active' });
	}
});

// **5.1 Fetch user's last active status**
fastify.get('/api/users/:id/ping', { preHandler: verifyToken }, async (request, reply) => {
	try {
	    const { id } = request.params;
		if (parseInt(id) !== request.user.id && !(JSON.parse((await dbGet('SELECT friends FROM users WHERE id = ?', [request.user.id])).friends)).includes(id)) {
			return reply.status(403).send({ error: "You only have access to your own and your friends' activity status" });
		}
		const lastActive = Math.floor(Date.now() / 1000) - (await dbGet('SELECT active FROM users WHERE id = ?', [id])).active;
		switch (true) {
			case lastActive <= 60:
				return reply.status(200).send({ message: 'Online' });
			case lastActive <= 300:
				return reply.status(200).send({ message: 'Last active recently' });
			case lastActive <= 3600:
				return reply.status(200).send({ message: 'Last active this hour' });
			case lastActive <= 86400:
				return reply.status(200).send({ message: 'Last active today' });
			default:
				return reply.status(200).send({ message: 'Offline' });
		}
	} catch {
        reply.status(500).send({ error: 'Failed to fetch activity status' });
	}
});

// **6. Delete user**
fastify.delete('/api/users/:id', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only delete your own profile' });
        }
        await dbRun('DELETE FROM users WHERE id = ?', [id]);
        reply.status(200).send({ message: 'User deleted successfully' });

		const users = await dbAll('SELECT id, friend_requests, friends FROM users')
		for (const user of users) {
			let friendRequests = JSON.parse(user.friend_requests);
			let friends = JSON.parse(user.friends);

			const cleanFriendRequests = friendRequests.filter(fid => fid !== id);
			const cleanFriends = friends.filter(fid => fid !== id);

			if (cleanFriendRequests.length !== friendRequests.length || cleanFriends.length !== friends.length) {
				await dbRun('UPDATE users SET friend_requests = ?, friends = ? WHERE id = ?', [JSON.stringify(cleanFriendRequests), JSON.stringify(cleanFriends), user.id]);
			}
		}
    } catch {
        reply.status(500).send({ error: 'Failed to delete user' });
    }
});

// **7. Login user**
fastify.post('/api/login', async (request, reply) => {
    const { email, password } = request.body;
    try {
        const user = await dbGet('SELECT id, email, password, verified, two_factor FROM users WHERE email = ?', [hmacHash(email)]);
        if (!user) {
            return reply.status(401).send({ error: 'Invalid email' });
        }
        if (!await bcrypt.compare(password, user.password)) {
            return reply.status(401).send({ error: 'Invalid password' });
        }
		if (!user.verified) {
			return reply.status(401).send({ error: 'Unverified email' });
		}
		if (user.two_factor) {
			reply.status(200).send({ message: '2FA enabled, check inbox' });
			const mailToken = jwt.sign({ id: user.id }, privateKey, { algorithm: 'RS256', expiresIn: '15m' });
			return await mail(email, mailToken, '2fa');
		}
		jwtSend(user.id, reply);
    } catch (err) {
        reply.status(500).send({ error: 'An error occurred while logging in' });
    }
});

// **7.1 Two-Factor Authentication**

fastify.get('/api/2fa', { preHandler: decode }, async (request, reply) => {
	const token = jwt.sign({ id: request.decoded.id }, privateKey, { algorithm: 'RS256', expiresIn: '12h' });
	reply.setCookie('token', token, {
		signed: true,
		httpOnly: true,
		secure: true,
		sameSite: 'Strict',
		path: '/',
		maxAge: 60 * 60 * 12 // 12 hours
	});
	autoClose('Login validated', reply);
});

fastify.post('/api/users/:id/2fa', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only toggle 2FA on your own profile' });
        }
        await dbRun('UPDATE users SET two_factor = NOT two_factor WHERE id = ?', [id]);
        reply.status(200).send({ message: '2FA toggled successfully' });
    } catch {
        reply.status(500).send({ error: 'Failed to toggle 2FA' });
    }
});

fastify.get('/api/users/:id/2fa', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only see whether 2FA is enabled/disabled on your own profile' });
        }
		const result = await dbGet('SELECT two_factor FROM users WHERE id = ?', [id]);
        reply.status(200).send({ two_factor: result.two_factor });
    } catch {
        reply.status(500).send({ error: 'Failed to get value for 2FA' });
    }
});

// **8. send friend request**
fastify.put('/api/users/:id/friends/requests', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only modify your own profile' });
        }
        const friendId = String(request.body.friendId);

        if (id === friendId) {
            return reply.status(400).send({ error: 'You cannot send a friend request to yourself' });
        }
        const friend = await dbGet('SELECT friend_requests, friends FROM users WHERE id = ?', [friendId]);
        if (!friend) return reply.status(404).send({ error: 'Friend to add not found' });

        let friendRequests = JSON.parse((await dbGet('SELECT friend_requests FROM users WHERE id = ?', id)).friend_requests);
        if (friendRequests.includes(friendId)) {
            return reply.status(403).send({ error: 'Friend already pending for you, please add them instead' });
        }

        let friends = JSON.parse(friend.friends);
        if (friends.includes(id)) {
            return reply.status(200).send({ message: 'Friend already added' });
        }

        let friendFriendRequests = JSON.parse(friend.friend_requests);
        if (friendFriendRequests.includes(id)) {
            return reply.status(200).send({ message: 'Friend request already pending' });
        }
        friendFriendRequests.push(id);
        await dbRun("UPDATE users SET friend_requests = ? WHERE id = ?", [JSON.stringify(friendFriendRequests), friendId]);
        reply.status(200).send({ message: 'Friend request sent successfully' });
    } catch {
        reply.status(500).send({ error: 'Failed to send friend request' });
    }
});

// **8.1 add friend**
fastify.put('/api/users/:id/friends', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only modify your own profile' });
        }
        const friendId = String(request.body.friendId);

        if (id === friendId) {
            return reply.status(400).send({ error: 'You cannot add yourself as friend' });
        }
        const user = await dbGet('SELECT friend_requests, friends FROM users WHERE id = ?', [id]);

        let friends = JSON.parse(user.friends);
		if (friends.includes(friendId)) {
			return reply.status(200).send({ message: 'Already friends' });
		}

        let friendRequests = JSON.parse(user.friend_requests);
        if (!friendRequests.includes(friendId)) {
			return reply.status(400).send({ error: 'Friend has not sent a friend request' });
        }

        friendRequests = friendRequests.filter(id => id !== friendId);
        friends.push(friendId);
        await dbRun("UPDATE users SET friend_requests = ?, friends = ? WHERE id = ?", [JSON.stringify(friendRequests), JSON.stringify(friends), id]);

        let friendFriends = JSON.parse((await dbGet('SELECT friends FROM users WHERE id = ?', friendId)).friends);
        friendFriends.push(id);
        await dbRun("UPDATE users SET friends = ? WHERE id = ?", [JSON.stringify(friendFriends), friendId]);
        reply.status(200).send({ message: 'Friends list updated successfully' });
    } catch {
        reply.status(500).send({ error: 'Failed to update friends list' });
    }
});

// **9. get friend requests list**
fastify.get('/api/users/:id/friends/requests', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only request your own friend requests list' });
        }
        reply.send(JSON.parse((await dbGet("SELECT friend_requests FROM users WHERE id = ?", [id])).friend_requests));
    } catch {
        reply.status(500).send({ error: 'Failed to retrieve friend requests list' });
    }
});

// **9.1 get friends list**
fastify.get('/api/users/:id/friends', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only request your own friends list' });
        }
        reply.send(JSON.parse((await dbGet("SELECT friends FROM users WHERE id = ?", [id])).friends));
    } catch {
        reply.status(500).send({ error: 'Failed to retrieve friends list' });
    }
});

// **10. delete friend request from friend requests list**
fastify.delete('/api/users/:id/friends/requests', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only delete friend requests from your own profile' });
        }
        const friendId = String(request.body.friendId);
        let friendRequests = JSON.parse((await dbGet("SELECT friend_requests FROM users WHERE id = ?", [id])).friend_requests);
        if (!friendRequests.includes(friendId)) {
            return reply.status(200).send({ message: 'Friend not on friend requests list' });
        }
        friendRequests = friendRequests.filter(id => id !== friendId);
        await dbRun("UPDATE users SET friend_requests = ? WHERE id = ?", [JSON.stringify(friendRequests), id]);

        reply.status(200).send({ message: 'friend requests list updated successfully' });
    } catch {
        reply.status(500).send({ error: 'Failed to retrieve friend requests list' });
    }
});

// **10.1 delete friend from friends list**
fastify.delete('/api/users/:id/friends', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
        if (parseInt(id) !== request.user.id) {
            return reply.status(403).send({ error: 'Forbidden: You can only delete friends from your own profile' });
        }
        const friendId = String(request.body.friendId);
        let friends = JSON.parse((await dbGet("SELECT friends FROM users WHERE id = ?", [id])).friends);
        if (!friends.includes(friendId)) {
            return reply.status(200).send({ message: 'Friend not on friends list' });
        }
        friends = friends.filter(id => id !== friendId);
        await dbRun("UPDATE users SET friends = ? WHERE id = ?", [JSON.stringify(friends), id]);

		const friend = await dbGet('SELECT friends FROM users WHERE id = ?', friendId);
		if (!friend) return reply.status(404).send({ error: 'Friend not found' });

        let friendFriends = JSON.parse(friend.friends);
        friendFriends = friendFriends.filter(fid => fid !== id);
        await dbRun("UPDATE users SET friends = ? WHERE id = ?", [JSON.stringify(friendFriends), friendId]);
        reply.status(200).send({ message: 'Friends list updated successfully' });
    } catch {
        reply.status(500).send({ error: 'Failed to retrieve friends list' });
    }
});

// **11. Get current user name**
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

// **12. Logout**
fastify.post('/api/logout', async (request, reply) => {
    reply.clearCookie('token', {
        path: '/'
    }).send({ ok: true });
});


// **13. Match history**
fastify.get('/api/users/:id/history', { preHandler: verifyToken }, async (request, reply) => {
    try {
        const { id } = request.params;
		if (parseInt(id) !== request.user.id && !(JSON.parse((await dbGet('SELECT friends FROM users WHERE id = ?', [request.user.id])).friends)).includes(id)) {
			return reply.status(403).send({ error: "You only have access to your own and your friends' match history" });
		}
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
		if (parseInt(id) !== request.user.id && !(JSON.parse((await dbGet('SELECT friends FROM users WHERE id = ?', [request.user.id])).friends)).includes(id)) {
			return reply.status(403).send({ error: "You only have access to your own and your friends' pong wins and losses" });
		}
        const user = await dbGet('SELECT id, nickname, avatar, pong_wins, pong_losses FROM users WHERE id = ?', [id]);
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
    const { winId, lossId, game, info } = request.body;
    if (!Number.isInteger(winId) || !Number.isInteger(lossId)) {
      throw new Error("Invalid user ID");
    }
    if (!VALID_GAMES.includes(game)) {
      throw new Error("Invalid game");
    }
    const win = await dbRun(`UPDATE users SET ${game}_wins = ${game}_wins + 1 WHERE id = ?`, [winId]);
    const loss =  await dbRun(`UPDATE users SET ${game}_losses = ${game}_losses + 1 WHERE id = ?`, [lossId]);
    const history = await dbRun('INSERT INTO matches (game, winner, loser, info) VALUES (?, ?, ?, ?)', [game, winId, lossId, info]);
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
