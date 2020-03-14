# AWS Lambda Server

Run a webserver on your lambda instance! Express, Koa, etc should now run without a hitch.

This is very similar to [aws-serverless-express](https://github.com/awslabs/aws-serverless-express). The main point being, it's a little more clean and simple to understand

## Example

Your Lambda Handler (usually `index.js`)

```js
const lambdaServer = require('aws-lambda-server');
const app = require('./app');

exports.handler = lambdaServer(app);
```

`app.js`

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

module.export = app;
```

And for testing locally (I like to name it `server.js`)

```js
const app = require('./app.js');

app.listen(3000, () => console.log('Now Listening'));
```

## Why not use `aws-serverless-express`

This focuses on simplicity and standard use cases. It also doesn't worry about legacy implementations of lambda callback / context use and is focused on Node 10 / 12 support only with an emphasis on async / await code

## Other inspiration

This was originally developed to handle next.js SSR on AWS Lambda. Officially there is no support and although packages like [serverless-nextjs-plugin](https://www.npmjs.com/package/serverless-nextjs-plugin) exist, they require more packages and the serverless deployment system.

Example of Next.js package soon to come
