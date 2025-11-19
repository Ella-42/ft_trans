// Get Fastify for network traffic handling
import Fastify from 'fastify';

// Load environment variables
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_CALLBACK_URL;

// Create Fastify instance
const app = Fastify();

// Response handler helper function to check status of fetch requests
function handleResponse(response)
{
	return (response.json()

	.then
	(
		data =>
		{
			if (!response.ok)
				throw (Object.assign(new Error(`HTTP: Status: ${response.status}; ${data.error}`), {status: response.status}));

			return (data);
		}
	));
}

// Redirect user to Google OAuth2 consent screen
function authenticator(request, response)
{
	const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');

	authURL.searchParams.set('client_id', clientID);
	authURL.searchParams.set('redirect_uri', redirectURI);
	authURL.searchParams.set('response_type', 'code');
	authURL.searchParams.set('scope', 'openid email profile');
	authURL.searchParams.set('access_type', 'offline');

	response.redirect(authURL.toString());
}

// Fetch access token from authorization code
function getToken(code)
{
	if (!code)
		throw (Object.assign(new Error('Failed to get authorization code from Google'), {status: 400}));

	return (fetch
	(
		'https://oauth2.googleapis.com/token',
		{
			method: 'POST',

			headers:
			{
				'Content-Type': 'application/x-www-form-urlencoded'
			},

			body: new URLSearchParams
			({
				grant_type: 'authorization_code',
				client_id: clientID,
				client_secret: clientSecret,
				code: code,
				redirect_uri: redirectURI
			})
		}
	)

	.then(handleResponse));
}

// Fetch user data using an access token
function getUserData(token)
{
	if (!token.access_token)
		throw (Object.assign(new Error('Token exchange failed'), {status: 500}));

	return (fetch
	(
		'https://www.googleapis.com/oauth2/v2/userinfo',
		{
			headers:
			{
				Authorization: `Bearer ${token.access_token}`
			}
		}
	)

	.then(handleResponse));
}

// Register user in database
function postUserData(userData)
{
	return (fetch
	(
		`http://database:4334/api/google_register`,
		{
			method: 'POST',

			headers:
			{
				'Content-Type': 'application/json'
			},

			body: JSON.stringify(userData)
		}
	));
}

// Set user's cookie to database's JWT
function setUserCookie(res, response)
{
	const cookie = res.headers.get('set-cookie');

	return (res.json()

	.then
	(
		data =>
		{
			if (!res.ok)
				throw (Object.assign(new Error(`HTTP: Status: ${res.status}; ${data.error}`), { status: res.status }));

			response.header('set-cookie', cookie);
		}
	));
}

// Extract authorization code, fetch access token and user data, register user in database, set user cookie and redirect
function handleCallback(request, response)
{
	return (getToken(request.query.code)

	.then(getUserData)

	.then(postUserData)

	.then
	(
		res =>
			setUserCookie(res, response)
	)

	.then(() => response.code(302).header('location', 'https://' + process.env.domain).send())

	.catch
	(
		error =>
		{
			console.error(error);
			response.status(error.status || 500).send(`Internal server error: ${error.message || error}`);
		}
	));
}

// Handle authentication requests
app.get('/auth', authenticator);

// Handle callback from Google
app.get('/auth/callback', handleCallback);

// Launch server locally on port 3080
app.listen({ host: '0.0.0.0', port: 3080 });
