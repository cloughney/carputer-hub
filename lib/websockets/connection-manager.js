const WebSocket = require('ws');

class ConnectionManager {
	constructor() {
		this._server = undefined;
		this._connections = [];
		this._connectionTypeMap = new Map();
		this._pingInterval = undefined;
	}

	setServer(server) {
		if (this._server) {
			throw new Error('The setServer method may only be called once.');
		}

		this._server = server;
		this._pingInterval = this._startPingInterval(10);
		this._server.on('connection', this._addConnection.bind(this));
	}

	_addConnection(client) {
		this._connections.push(client);

		const socketType = client.protocol;
		const typedConnections = this._connectionTypeMap.get(socketType) || [];
		typedConnections.push(client);
		this._connectionTypeMap.set(socketType, typedConnections);

		client.on('message', this._handleMessage.bind(this, client));
		client.on('pong', () => { client.isAlive = true; });
	}

	_removeConnection(client) {
		this._connections.splice(this._connections.indexOf(client), 1);

		const socketType = client.protocol;
		const typedConnections = this._connectionTypeMap.get(socketType);
		typedConnections.splice(typedConnections.indexOf(client), 1);

		socket.terminate();
	}

	_startPingInterval(pingDelaySeconds) {
		return setInterval(() => {
			this._connections.forEach(socket => {
				if (socket.isAlive === false) {
					return this._removeConnection(socket);
				}

				socket.isAlive = false;
				socket.ping('', false, true);
			});
		}, pingDelaySeconds * 1000);
	}

	_handleMessage(client, message) {
		message = JSON.parse(message);
		if (message.type === 'event') {
			this._broadcastMessage(message, client);
		}
	}

	_broadcastMessage(message, sender) {
		this._connections.forEach(client => {
			if (client !== sender && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		})
	}
}

module.exports = new ConnectionManager();
