import { readFileSync } from 'fs'; //read files from system
import { connect as tcpConnect } from 'net'; //open tcp connection
import { connect as tlsConnect } from 'tls'; //open tls connection
import crypto from 'crypto'; //encryption

// Load variables
const domain = process.env.domain;

const dkimPrivateKey = readFileSync(`/etc/ssh/${domain}_dkim_private.key`, 'utf-8');
const smtpServer = 'smtp.eu.mailgun.org'; //for SMTP port as DigitalOcean blocks them all
const from = `no-reply@${domain}`;

// Format headers
function canonicalizeHeaders(headers, dkimHeaders)
{
	return (headers

		.filter(([key]) => dkimHeaders.includes(key.toLowerCase()))
		.map(([key, value]) => `${key.toLowerCase()}:${value.trim().replace(/\s+/g,' ')}`)
		.join('\r\n')
	);
}

// Format body
function canonicalizeBody(body)
{
	const lines = body.split(/\r?\n/);

	while (lines.length && lines[lines.length - 1].trim() === '')
		lines.pop();

	return (lines.join('\r\n') + '\r\n');
}

// Format and sign DKIM headers
function generateDkimHeader(headers, body)
{
	const dkimHeaders = ['from', 'to', 'subject', 'date'];
	const canonicalizedHeader = canonicalizeHeaders(headers, dkimHeaders);

	const bodyCanonical = canonicalizeBody(body);
	const bodyHash = crypto.createHash('sha256').update(bodyCanonical).digest('base64');

	const dkimHeaderParams =
	[
		'v=1',
		'a=rsa-sha256',
		'c=relaxed/simple',
		`d=${domain}`,
		`s=default`,
		`h=${dkimHeaders.join(':')}`,
		`bh=${bodyHash}`,
		'b='
	].join('; ');

	const signingData = `${canonicalizedHeader}\r\ndkim-signature:${dkimHeaderParams}`;
	const signer = crypto.createSign('RSA-SHA256');
	signer.update(signingData);
	const signature = signer.sign(dkimPrivateKey, 'base64').replace(/(.{73})/g, '$1\r\n\t');

	return (`DKIM-Signature: ${dkimHeaderParams}${signature}\r\n`);
}

// Connect to SMTP server, format email and send it using SMTP
export function sendMail(to, subject, body)
{
	// Fake bs port bcs nobody trusts anyone over mail protocol
	let socket = tcpConnect(2525, smtpServer);

	// Helper functions
	const sendCommand = (command) => socket.write(command + '\r\n');
	const readResponse = () =>
		new Promise(resolve => socket.once('data', data => resolve(data.toString())));
	const handleResponse = (statusCode, errorMessage, command) => response =>
	{
		if (!response.startsWith(statusCode))
			throw (new Error(`${errorMessage}; full response: ${response}`));

		sendCommand(command);

		return (readResponse());
	};

	// Formatting
	const date = new Date().toUTCString();
	const headers =
	[
		['From', from],
		['To', to],
		['Subject', subject],
		['Date', date],
		['Content-Type', 'text/html; charset=UTF-8']
	];
	const dkimHeader = generateDkimHeader(headers, body);

	const rawMail =
		`From: ${from}\r\n` +
		`To: ${to}\r\n` +
		`Subject: ${subject}\r\n` +
		`Date: ${date}\r\n` +
		'Content-Type: text/html; charset=UTF-8\r\n' +
		dkimHeader +
		`\r\n${body}\r\n.\r\n`;

	// Start up connection
	return (new Promise
	(
		(resolve, reject) =>
		{
			socket.once('error', reject);
			socket.once('connect', resolve);
		}
	))

	.then(() => readResponse())

	// If anyone's there, upgrade to secure connection
	.then(handleResponse('220', 'No 220', `EHLO ${domain}`))
	.then(handleResponse('250', 'EHLO failed', `STARTTLS`))

	.then((response) =>
	{
		if (!response.startsWith('220'))
			throw new Error(`STARTTLS failed; full response: ${response}`);

		return (new Promise((resolve, reject) =>
		{
			socket.removeAllListeners('data');
			socket = tlsConnect({ socket, servername: smtpServer }, () => resolve(socket));
			socket.once('error', reject);
		}))

		.then(() =>
		{
			sendCommand(`EHLO ${domain}`);
			return readResponse();
		});
	})

	// Log in to SMTP server and talk SMTP to them to send the email
	.then(handleResponse('250', 'EHLO failed', `AUTH LOGIN`))
	.then(handleResponse('334', 'AUTH LOGIN failed', Buffer.from(process.env.SMTP_USER).toString('base64')))
	.then(handleResponse('334', 'SMTP user rejected', Buffer.from(process.env.SMTP_PASSWORD).toString('base64')))
	.then(handleResponse('235', 'SMTP password rejected', `MAIL FROM:<${from}>`))
	.then(handleResponse('250', 'MAIL FROM failed', `RCPT TO:<${to}>`))
	.then(handleResponse('250', 'RCTP TO failed', 'DATA'))
	.then(handleResponse('354', 'DATA failed', rawMail))
	.then(handleResponse('250', 'Send failed', 'QUIT'))

	// Close the socket, in case anything went wrong, log the error based on the server's response
	.catch(console.error)
	.finally(() => { socket.end() });
}
