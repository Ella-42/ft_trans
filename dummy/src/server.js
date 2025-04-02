import Fastify from 'fastify';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';
import fs from 'fs';

const fastify = Fastify({
    logger: true,
    https: {
        key: fs.readFileSync('/etc/ssh/ella-peeters.me.key'),  // Private key
        cert: fs.readFileSync('/etc/ssl/trans_ella-peeters_me/trans_ella-peeters_me.crt'),  // Certificate
        ca: fs.readFileSync('/etc/ssl/trans_ella-peeters_me/trans_ella-peeters_me.ca-bundle'),  // CA Bundle
    }
});

// Proxy requests to backend service
const SQLITE_URL = 'http://server:3443';

const ws = new WebSocket('ws://server:3443/ws');

ws.on('open', () => {
    console.log('Connected to WebSocket');
    ws.send('Hello from Node.js client!');
});

ws.on('message', (message) => {
    console.log('Received:', message.toString());
});

ws.on('close', () => {
    console.log('WebSocket closed');
});

// Serve static HTML page
fastify.get('/', (req, reply) => {
    reply.sendFile('index.html');
});


// Fetch all users
fastify.get('/api/users', async (req, reply) => {
    try {
        const response = await fetch(`${SQLITE_URL}/users`);
        const users = await response.json();
        reply.send(users);
    } catch (error) {
        reply.status(500).send({ error: 'Error fetching users' });
    }
});

// Add user
fastify.post('/api/users', async (req, reply) => {
    try {
        const response = await fetch(`${SQLITE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        reply.send(data);
    } catch (error) {
        reply.status(500).send({ error: 'Error adding user' });
    }
});


// update user
fastify.put('/api/users/:id', async (req, reply) => {
    try {
        const response = await fetch(`${SQLITE_URL}/users/${req.params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        reply.send(data);
    } catch (error) {
        reply.status(500).send({ error: 'Error updating user' });
    }
});

// Delete user
fastify.delete('/api/users/:id', async (req, reply) => {
    try {
        const response = await fetch(`${SQLITE_URL}/users/${req.params.id}`, { method: 'DELETE' });
        const data = await response.json();
        reply.send(data);
    } catch (error) {
        reply.status(500).send({ error: 'Error deleting user' });
    }
});

// getting friends list
fastify.get('/api/users/:id/friends', async (req, reply) => {
    try {
        const response = await fetch(`${SQLITE_URL}/users/${req.params.id}/friends`);
        const users = await response.json();
        reply.send(users);
    } catch (error) {
        reply.status(500).send({ error: 'Error getting friends list' });
    }
});


// update friend list
fastify.put('/api/users/:id/friends', async (req, reply) => {
    try {
        const response = await fetch(`${SQLITE_URL}/users/${req.params.id}/friends`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        reply.send(data);
    } catch (error) {
        reply.status(500).send({ error: 'Error updating user friends list' });
    }
});

// Delete user from friend list
fastify.delete('/api/users/:id/friends', async (req, reply) => {
    try {
        const response = await fetch(`${SQLITE_URL}/users/${req.params.id}/friends`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        reply.send(data);
    } catch (error) {
        reply.status(500).send({ error: 'Error deleting user' });
    }
});

// Serve static files
fastify.register(import('@fastify/static'), {
    root: '/var/www/dummy',
});

fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`Frontend running at ${address}`);
});
