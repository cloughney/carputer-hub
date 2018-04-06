const Node = require('./node');
const { Client, WebHookClient } = require('../client');

class InternalNodeBase extends Node {
	constructor(uid) {
		super(uid);
		this._client = undefined;
	}

	get client() { return this._client; }

	sendMessage(message) {
		this._client.handleMessage(message);
	}

	ping() { this._raiseEvent('pong'); }

	destroy() {	}
}

class InternalNode extends InternalNodeBase {
	constructor(uid) {
		super(uid);
		this._client = new Client({
			send: this._raiseEvent.bind(this, 'message'),
			setAbilities: this._raiseEvent.bind(this, 'abilities')
		});
	}
}

class InternalWebHookNode extends InternalNodeBase {
	constructor(uid) {
		super(uid);
		this._client = new WebHookClient({
			send: this._raiseEvent.bind(this, 'message'),
			setAbilities: this._raiseEvent.bind(this, 'abilities')
		});
	}

	sendWebHook(request, response) {
		this._client.handleWebHook(request, response);
	}
}

module.exports = { InternalNode, InternalWebHookNode };
