const Koa = require('koa');
const route = require('koa-router');
const websockify = require('koa-websocket');

const allowedWsProtocols = ['interface', 'audio-player'];

const app = websockify(new Koa(), {
	handleProtocols: protocols => (protocols || []).find(p => allowedWsProtocols.includes(p)) || false
});

const api = route();
const ws = route();

api.get('/', async ctx => {
	ctx.body = 'hello';
});

ws.get('/', async ctx => {
	ctx.websocket.send('hey! ' + ctx.websocket.protocol);

	ctx.websocket.on('message', message => {
		console.log(message);
		ctx.websocket.send('REPL: ' + message);
	});
});

app.use(api.routes()).use(api.allowedMethods());
app.ws.use(ws.routes()).use(ws.allowedMethods());

app.listen(3000);
