const WebSocket = require('ws');
const connections = require('./connection-manager');

class ClientNotConnectedError extends Error { }

class Client {
	constructor(clientType) {
		this._clientType = clientType;
		this._socket = undefined;
		this._onConnect = undefined;
		this._onEvent = undefined;
	}

	get isConnected() { return this._socket && this._socket.readyState === WebSocket.OPEN; }

	set onConnect(handler) {
		if (this._onConnect) {
			throw new Error('The onConnect handler can only be set once.');
		}

		this._onConnect = handler;
		this._socket.on('open', () => this._onConnect());

		if (this._socket && this._socket.readyState === WebSocket.OPEN) {
			handler();
		}
	}

	set onEvent(handler) {
		if (this._onEvent) {
			throw new Error('The onEvent handler can only be set once.');
		}

		this._onEvent = handler;
		this._socket.on('message', message => this._onEvent(JSON.parse(message)));
	}

	connect() {
		this._socket = new WebSocket('ws://localhost:9000', this._clientType);

		if (this._onConnect) {
			this._socket.on('open', () => this._onConnect());
		}

		if (this._onEvent) {
			this._socket.on('message', message => this._onEvent(JSON.parse(message)));
		}
	}

	disconnect() {
		this._verifyState(false);
		this._socket.close();
		this._socket = undefined;
	}

	post(message) {
		this._verifyState();
		this._socket.send(JSON.stringify(message));
	}

	_verifyState(checkReadyState = true) {
		if (!this._socket) {
			throw new ClientNotConnectedError('You must call connect() before doing this.');
		}
		if (checkReadyState && this._socket.readyState !== WebSocket.OPEN) {
			throw new ClientNotConnectedError(`The client is not connected. (state: ${this._socket.readyState})`);
		}
	}
}

module.exports = Client;
