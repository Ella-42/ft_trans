const fastify = require('fastify')({ logger: true });
const domain = process.env.domain;

fastify.get('/', async () => `Testing ${domain}`);

fastify.listen({ host: '0.0.0.0', port: 3443 }, err => {
    if (err) throw err;
    console.log(`Server running on http://${domain}:3443`);
});
