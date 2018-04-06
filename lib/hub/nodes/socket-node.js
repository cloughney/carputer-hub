const WebSocket = require('ws');
const Node = require('./node');

class SocketNode extends Node {
	constructor(uid, socket) {
		super(uid);
		this._socket = socket;
		this._socket.on('message', message => { this._raiseEvent('message', JSON.parse(message)); });
		this._socket.on('pong', this._raiseEvent.bind(this, 'pong'));
		this._socket.on('close', this._raiseEvent.bind(this, 'close'));
		this._requestPromiseMap = new Map();
	}

	get socket() { return this._socket; }

	sendMessage(message) {
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
