// Get dotenv for environment variable processing
import dotenv from 'dotenv';
// Get Fastify for network traffic handling
import Fastify from 'fastify';

// Load environment variables
dotenv.config();

// Placeholder, credentials are requested with Google and it may take a while to be fully set up
function tester(request, response)
{
	response.send('Test success.');
	console.log('Test success.');
}

// Create Fastify instance
const app = Fastify();

// Handle authentication requests
app.get('/auth', tester);

// Launch server locally on port 3080
app.listen({ host: '0.0.0.0', port: 3080 });
