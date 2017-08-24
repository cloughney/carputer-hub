const connections = require('./connection-manager');

class Client {
	constructor(clientType) {
		this._clientType = clientType;
		this._socket = undefined;
		this._onConnected = undefined;
		this._onMessageReceived = undefined;
	}

	get isConnected() { return this._socket.readyState === WebSocket.OPEN; }
	set onConnected(handler) { this._onConnected = handler; }
	set onMessageReceived(handler) { this._onMessageReceived = handler; }

	connect() {
		this._socket = new WebSocket('ws://localhost', this._clientType);
		this._socket.onmessage(this._onMessageReceived.bind(this, JSON.parse(message)));
	}

	disconnect() {
		this._socket.close();
	}

	subscribe(criteria) {
		this._socket.send(JSON.stringify({
			type: 'subscriber',
			criteria
		}));
	}

	post(message) {
		this._socket.send(JSON.stringify(message));
	}
}

module.exports = Client;
