const Node = require('./node');
const Client = require('../client');

class InternalNode extends Node {
	constructor(uid, { registerWebHook }) {
		super(uid);
		this._client = new Client({
			send: this._raiseEvent.bind(this, 'message'),
			setAbilities: this._raiseEvent.bind(this, 'abilities'),
			registerWebHook
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
