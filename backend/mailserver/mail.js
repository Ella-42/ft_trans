import Fastify from 'fastify';

const app = Fastify();

function sendVerification(request, response)
{
	const { to, token } = request.body;
	console.log(`endpoint /verify reached with data: ${to}, ${token}`)
	response.send({ success: true });
}

app.post('/verify', sendVerification);

app.listen({ host: '0.0.0.0', port: 2626 });
