/*

This creates an http server (for use with express, koa, etc) and serve it through lambda

References:
https://github.com/zeit/now-builders/blob/fa411a5e4cb10de2ceafa30d335652a16d1963f4/packages/now-node-bridge/src/bridge.ts
https://github.com/awslabs/aws-serverless-express/blob/master/src/index.js

*/

const http = require('http');
const url = require('url');
const binarycase = require('binary-case');

process.on('unhandledRejection', (err) => {
	console.error('Unhandled rejection:', err);
	process.exit(1); // eslint-disable-line no-process-exit
});

const getSocketPath = () => {
	const socketPathSuffix = Math.random()
		.toString(36)
		.substring(2, 15);

	return `/tmp/server-${socketPathSuffix}.sock`;
};

const getEventBody = (event) => Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

const handleError = (error, statusCode = 500) =>
	console.error(error) || {
		body: error.message,
		headers: {},
		isBase64Encoded: false,
		statusCode,
	};

const handleHeaders = (originalHeaders, bodyBuffer) => {
	// HACK: modifies header casing to get around API Gateway's limitation of not allowing multiple
	// headers with the same name, as discussed on the AWS Forum https://forums.aws.amazon.com/message.jspa?messageID=725953#725953
	delete originalHeaders.connection;

	return {
		'content-length': String(bodyBuffer.length),
		...Object.keys(originalHeaders).reduce((result, header) => {
			const value = originalHeaders[header];

			if (header.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
				return {
					...result,
					...value.reduce(
						(headers, cookie, index) => ({ ...headers, [binarycase(header, index + 1)]: cookie }),
						{},
					),
				};
			}

			return {
				...result,
				[header.toLowerCase()]: Array.isArray(value) ? value.join(',') : value,
			};
		}, {}),
	};
};

const handleRequestResponse = (response) =>
	new Promise((resolve, reject) => {
		const respBodyChunks = [];

		response.on('data', (chunk) => {
			respBodyChunks.push(Buffer.from(chunk));
		});
		response.on('error', reject);
		response.on('end', () => {
			const bodyBuffer = Buffer.concat(respBodyChunks);

			resolve({
				body: bodyBuffer.toString('base64'),
				headers: handleHeaders(response.headers, bodyBuffer),
				isBase64Encoded: true,
				statusCode: response.statusCode || 200,
			});
		});
	});

const proxyEvent = (event, socketPath) =>
	new Promise((resolve) => {
		const requestOptions = {
			headers: event.headers,
			method: event.httpMethod,
			path: url.format({ pathname: event.path, query: event.queryStringParameters }),
			socketPath,
		};

		const req = http.request(requestOptions, async (res) => {
			try {
				const response = await handleRequestResponse(res);

				resolve(response);
			} catch (error) {
				resolve(handleError(error));
			}
		});

		if (event.body) {
			req.write(getEventBody(event));
		}

		req.on('error', (error) => resolve(handleError(error, 502)));
		req.end();
	});

const proxy = (requestListener) => {
	const server = http.createServer(requestListener);
	const socketPath = getSocketPath();
	let serverIsListenting = false;

	server.on('listening', () => {
		serverIsListenting = true;
	});
	server.on('close', () => {
		serverIsListenting = false;
	});

	return async (event) => {
		if (!serverIsListenting) {
			await new Promise((resolve) => server.listen(socketPath).on('listening', resolve));
		}

		const response = await proxyEvent(event, socketPath);

		server.close();

		return response;
	};
};

module.exports = proxy;
