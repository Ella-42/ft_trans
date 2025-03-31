import sqlite3 from 'sqlite3';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';

const fastify = Fastify({ logger: true });
const { Database } = sqlite3;
const domain = process.env.domain;


// Initialize SQLite database
const db = new Database('/var/www/db/pong.sqlite', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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
            password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            friends TEXT DEFAULT '[]',
            blocked TEXT DEFAULT '[]',
            pong_wins INT DEFAULT 0,
            pong_losses INT DEFAULT 0,
            pong_tournament_wins INT DEFAULT 0
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

// **1. Fetch all users**
fastify.get('/users', async (request, reply) => {
    try {
        const users = await dbAll('SELECT * FROM users');
        reply.send(users);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch users' });
    }
});

// **2. Fetch user by ID**
fastify.get('/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) return reply.status(404).send({ error: 'User not found' });
        reply.send(user);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to fetch users' });
    }
});

// **3. Add new user**
fastify.post('/register', async (request, reply) => {
    try {
        const { name, email, password } = request.body;
	    console.log("The email is: ", email);
	    console.log("The password after hashing is: ", password);
        if (!password) return reply.status(400).send({ error: 'Password is required' });

        const result = await dbRun('INSERT INTO users (nickname, email, password) VALUES (?, ?, ?)', [name, email, password]);
        reply.status(201).send({ id: result.lastID, name, email });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return reply.status(400).send({ error: 'Email or nickname is already in use' });
        }
        reply.status(500).send({ error: 'Failed to add user' });
    }
});

// **4. Update user**

function isEmptyOrNull(str) {
    return str === null || str === "" || str === undefined;
};

fastify.put('/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const { name, email, password } = request.body;
        let updated = 0;

        // Check if user exists before updating
        const existingUser = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
        if (!existingUser) return reply.status(404).send({ error: 'User not found' });

        if (isEmptyOrNull(name) && isEmptyOrNull(email) && isEmptyOrNull(password)) {
            return reply.status(204).send({ message: 'No changes made' });
        };
        // Perform the update
        if (!isEmptyOrNull(name) && !isEmptyOrNull(email) && !isEmptyOrNull(password)) {
            const result = await dbRun('UPDATE users SET nickname = ?, email = ?, password = ? WHERE id = ?', [name, email, password, id]);
            if (!result.changes) return reply.status(204).send({ message: 'No changes made' });
            reply.send({ message: 'User updated successfully' });
            return ;
        };
        if (!isEmptyOrNull(name)) {
            const newname = await dbRun('UPDATE users SET nickname = ? WHERE id = ?', [name, id]);
            if (newname.changes) updated = 1;
        };
        if (!isEmptyOrNull(email)) {
            const newemail = await dbRun('UPDATE users SET email = ? WHERE id = ?', [email, id]);
            if (newemail.changes) updated = 1;
        };
        if (!isEmptyOrNull(password)) {
            const newpassword = await dbRun('UPDATE users SET password = ? WHERE id = ?', [password, id]);
            if (newpassword.changes) updated = 1;
        };
        if (!updated) return reply.status(204).send({ message: 'No changes made' });
        reply.send({ message: 'User updated successfully' });
    } catch (err) {
        reply.status(500).send({ error: 'Failed to update user' });
    }
});

// **5. Delete user**
fastify.delete('/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);

        if (result.changes === 0) return reply.status(404).send({ error: 'User not found' });

        reply.send({ message: 'User deleted successfully' });
    } catch (err) {
        reply.status(500).send({ error: 'Failed to delete user' });
    }
});

// **6.  login user**
fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;
    try {
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ email: user.email }, 'secretKey', { expiresIn: '12h' });
        res.send(token);
    } catch (err) {
        reply.status(500).send({ error: 'An error occurred while logging in' });
    }
});


fastify.get('/', async () => `Testing ${domain}`);

fastify.listen({ host: '0.0.0.0', port: 3443 }, err => {
    if (err) throw err;
    console.log(`Server running on http://${domain}:3443`);
});
