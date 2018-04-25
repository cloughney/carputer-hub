const Node = require('./node');
const Client = require('../client');

class InternalNode extends Node {
	constructor(uid, { registerEndpoint }) {
		super(uid);
		this._client = new Client({
			send: this._raiseEvent.bind(this, 'message'),
			setAbilities: this._raiseEvent.bind(this, 'abilities'),
			registerEndpoint
		});
	}

	get client() { return this._client; }

	sendMessage(message) {
		this._client.handleMessage(message);
	}

	ping() { this._raiseEvent('pong'); }

	destroy() {	}
}

module.exports = InternalNode;
