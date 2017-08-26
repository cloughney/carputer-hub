const Node = require('./node');
const Client = require('../client');

class InternalNode extends Node {
	constructor(abilities) {
		super();
		this._abilities = abilities;
		this._client = new Client({
			publishHandler: this._raiseEvent.bind(this, 'message')
		});
	}

	get abilities() { return this.abilities; }

	get client() { return this._client; }

	send(message) {
		switch (message.type) {
			case 'event':
				if (typeof this._client.onEventReceived === 'function') {
					this._client.onEventReceived(message);
				}
				break;
			case 'request':
				if (typeof this._client.onRequestReceived === 'function') {
					this._client.onRequestReceived(message);
				}
				break;
			case 'response':
				throw new Error('Not implemented');
				break;
		}
	}

	ping() {
		this._raiseEvent('pong');
	}

	destroy() {	}
}

module.exports = InternalNode;
