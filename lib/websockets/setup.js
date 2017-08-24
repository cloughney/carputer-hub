const connections = require('./connection-manager');

const allowedWsProtocols = ['interface', 'module'];
const checkProtocol = protocols => (protocols || []).find(p => allowedWsProtocols.includes(p)) || false;

function setupWebSockets(app) {
	const wsApp = websockify(app, {
		handleProtocols: checkProtocol
	});

	connections.setServer(wsApp.ws.server);

	const ws = new Router();
	ws.get('/', async ctx => {
		connections.addConnection(ctx.websocket);
	});

	wsApp.ws.use(ws.routes()).use(ws.allowedMethods());
	return wsApp;
}

module.exports = setupWebSockets;
