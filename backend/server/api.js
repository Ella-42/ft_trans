const fastify = require('fastify')({ logger: true });
const domain = process.env.domain;

fastify.get('/api', async () =>
{
	return { message: 'API example through Nginx' }
});

fastify.listen({ host: '0.0.0.0', port: 3443 }, err =>
{
    if (err)
		throw err;

    console.log(`Server running on https://${domain}/api`);
});
