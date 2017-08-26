class Client {
	constructor({ publishHandler }) {
		this._publish = publishHandler;
		this._onEventReceived = undefined;
		this._onRequestReceived = undefined;
	}

	set onEventReceived(handler) {
		if (this._onEventReceived) {
			throw new Error('The onEventReceived handler can only be set once.');
		}

		this._onEventReceived = handler;
	}

	set onRequestReceived(handler) {
		if (this._onRequestReceived) {
			throw new Error('The onRequestReceived handler can only be set once.');
		}

		this._onRequestReceived = handler;
	}

	publish(event) { this._publish(event); }
}

module.exports = Client;
