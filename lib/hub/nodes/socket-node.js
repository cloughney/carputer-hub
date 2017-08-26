const WebSocket = require('ws');
const Node = require('./node');

class SocketNode extends Node {
	constructor(socket) {
		super();
		this._socket = socket;
		this._socket.on('message', this._raiseEvent.bind(this, 'message'));
		this._socket.on('pong', this._raiseEvent.bind(this, 'pong'));
	}

	get abilities() { return [this._socket.protocol]; }

	get socket() { return this._socket; }

	send(message) {
		if (this._socket.readyState === WebSocket.OPEN) {
			this._socket.send(JSON.stringify(message));
		}
	}

	ping() {
		this._socket.ping('', false, true);
	}

	destroy() {
		this._socket.terminate();
	}
}

module.exports = SocketNode;
