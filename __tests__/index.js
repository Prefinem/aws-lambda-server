const lambdaServer = require('./../src');
const express = require('express');

const event = {
	body: '',
	headers: {
		accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'accept-encoding': 'gzip',
		'accept-language': 'en-US,en;q=0.5',
		connection: 'keep-alive',
		cookie: 'name=value',
		host: 'lambda-YYYYYYYY.elb.amazonaws.com',
		'upgrade-insecure-requests': '1',
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:60.0) Gecko/20100101 Firefox/60.0',
		'x-amzn-trace-id': 'Root=1-5bdb40ca-556d8b0c50dc66f0511bf520',
		'x-forwarded-for': '192.0.2.1',
		'x-forwarded-port': '80',
		'x-forwarded-proto': 'http',
	},
	httpMethod: 'GET',
	isBase64Encoded: false,
	path: '/',
	queryStringParameters: {},
	requestContext: {
		elb: {
			targetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:XXXXXXXXXXX:targetgroup/sample/6d0ecf831eec9f09',
		},
	},
};

test('basic test', async () => {
	const app = express();

	app.get('/', (req, res) => res.send('Hello World!'));

	const response = await lambdaServer(app)(event);

	await expect(response).toEqual({
		body: 'SGVsbG8gV29ybGQh',
		headers: {
			'content-length': '12',
			'content-type': 'text/html; charset=utf-8',
			date: expect.any(String),
			etag: expect.any(String),
			'x-powered-by': 'Express',
		},
		isBase64Encoded: true,
		statusCode: 200,
	});
});
