//TODO use EventEmitter where possible
class Client {
	constructor({ send, setAbilities, registerWebHook }) {
		this._send = send;
		this._setAbilities = setAbilities;
		this._registerWebHook = registerWebHook;
		this._onEventReceived = undefined;
		this._onRequestReceived = undefined;
		this._requestPromiseMap = new Map();
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

	set abilities(abilities) { this._setAbilities(abilities); }

	publish(event) {
		if (!event || !event.name) {
			throw new Error('Bad arguments passed to publish().');
		}

		this._send({ ...event, type: 'event' });
	}

	registerWebHook(path, handler) { this._registerWebHook(path, handler); }

	async request(request) {
		if (!request || !request.name || !request.destination) {
			throw new Error('Bad arguments passed to request().');
		}

		let resolvePromise;
		const promise = new Promise(resolve => { resolvePromise = resolve; });
		this._requestPromiseMap.set(request.id, resolvePromise);
		this._send({ ...request, type: 'request' });

		const response = await promise;
		return {
			...response,
			type: 'response',
			id: request.id,
			name: request.name,
			origin: message.destination,
			destination: message.origin
		};
	}

	async handleMessage(message) {
		switch (message.type) {
			case 'event':
				if (typeof this._onEventReceived !== 'function') { return; }
				this._onRequestReceived(message)
				break;

			case 'request':
				if (typeof this._onRequestReceived !== 'function') { return; }

				let response;
				try {
					response = await Promise.resolve(this._onRequestReceived(message));
					response = {
						...response,
						type: 'response',
						id: message.id,
						name: message.name,
					};
				} catch (err) {
					response = {
						type: 'error',
						error: { message: `A unexpected error occurred during the request: ${err.message}` },
						originalMessage: message
					};
				}

				this._send({
					...response,
					origin: message.destination,
					destination: message.origin
				});
				break;

			case 'response':
				const resolvePromise = this._requestPromiseMap.get(message.id);
				if (typeof resolvePromise === 'function') {
					resolvePromise(message);
					this._requestPromiseMap.delete(message.id);
				}
				break;

			case 'error':
				//TODO error message routing
				break;
		}
	}
}

module.exports = Client;
