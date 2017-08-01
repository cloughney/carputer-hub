// import * as Koa from 'koa';
// import * as Router from 'koa-router';
// import * as websockify from 'koa-websocket';
//
// //const allowedWsProtocols = ['interface', 'audio-player'];
// //{ 	handleProtocols: protocols => (protocols || []).find(p => allowedWsProtocols.includes(p)) || false }
//
// const app = websockify(new Koa());
//
// const api = new Router();
// const ws = new Router();
//
// api.get('/', async ctx => {
// 	ctx.body = 'hello';
// });
//
// const clientMap = new Map<string, Socket>();
// ws.get('/', async ctx => {
// 	const clients = clientMap.get(ctx.websocket.protocol) || [];
// 	clients.push(ctx.websocket);
// 	clientMap.set(ctx.websocket.protocol, clients);
//
// 	ctx.websocket.on('message', message => {
//
// 	});
// });
//
// app.use(api.routes()).use(api.allowedMethods());
// app.ws.use(ws.routes()).use(ws.allowedMethods());
//
// app.listen(3000);
