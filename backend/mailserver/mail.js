import Fastify from 'fastify';
import { config } from 'dotenv';
import { sendMail } from './server.js';
import { readFileSync } from 'fs';

const app = Fastify();
config();

function sendVerification(request, response)
{
	const { to, token } = request.body;

	return sendMail(to, 'Email Verification Required for Pong Account', readFileSync('./mail.html', 'utf-8').replace(/ERROR/g, `https://${process.env.subDomain}/api/verify?token=${token}`))
	.then(() => response.send({ success: true }))
	.catch(error => response.status(error.status || 500).send({ success: false, error: error.message }));
}

app.post('/verify', sendVerification);

app.listen({ host: '0.0.0.0', port: 2626 });
