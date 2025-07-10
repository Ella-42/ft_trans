import Fastify from 'fastify';
import { sendMail } from './server.js';
import { readFileSync } from 'fs';

const app = Fastify();

const sendVerification = endpoint => (request, response) =>
{
	const { to, token } = request.body;

	return sendMail
	(
		to,
		'Email Verification Required for Pong Account',
		readFileSync('./mail.html', 'utf-8')
		.replace(/ERROR/g, `https://${process.env.subDomain}/api/${endpoint}?token=${token}`)
	)

	.then(() =>
	{
		response.status(200)
		.send({ ok: true })
	})

	.catch(error =>
	{
		response.status(error.status)
		.send({ error: error.message })
	})
}

app.post('/verify', sendVerification('verify'));

app.post('/update', sendVerification('update'));

app.listen({ host: '0.0.0.0', port: 2626 });
