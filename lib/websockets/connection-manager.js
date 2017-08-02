class ConnectionManager {
	constructor() {
		this.connections = [];
		this.connectionTypeMap = new Map();
	}

	setServer(server) {
		if (this.server) { throw new Error('The setServer method may only be called once.'); }

		this.server = server;
		this.pingInterval = this.startPingInterval(10);
	}

	addClient(socket) {
		this.connections.push(socket);

		const socketType = socket.protocol;
		const typedConnections = this.connectionTypeMap.get(socketType) || [];
		typedConnections.push(socket);
		this.connectionTypeMap.set(socketType, typedConnections);

		socket.on('pong', () => { socket.isAlive = true; });
	}

	removeClient(socket) {
		this.connections.splice(this.connections.indexOf(socket), 1);

		const socketType = socket.protocol;
		const typedConnections = this.connectionTypeMap.get(socketType);
		typedConnections.splice(typedConnections.indexOf(socket), 1);

		socket.terminate();
	}

	startPingInterval(pingDelaySeconds) {
		return setInterval(() => {
			this.connections.forEach(socket => {
				if (socket.isAlive === false) {
					return this.removeClient(socket);
				}

				socket.isAlive = false;
				socket.ping('', false, true);
			});
		}, pingDelaySeconds * 1000);
	}
}

module.exports = new ConnectionManager();
