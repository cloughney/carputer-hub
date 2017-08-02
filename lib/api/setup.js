const Router = require('koa-router');

function setupApi(app) {
	const api = new Router();

	api.get('/', async ctx => {
		ctx.body = 'hello';
	});

	app.use(api.routes()).use(api.allowedMethods());
	return app;
}

module.exports = setupApi;
