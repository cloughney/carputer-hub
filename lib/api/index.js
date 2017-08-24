const Router = require('koa-router');
const audioApi = require('./audio');

const api = new Router({ prefix: '/api' });

api.use(async (ctx, next) => {
	ctx.set('Access-Control-Allow-Origin', '*');
	ctx.response.type = 'json';
	await next();
});

api.use('/audio', audioApi.routes(), audioApi.allowedMethods());

module.exports = api;
