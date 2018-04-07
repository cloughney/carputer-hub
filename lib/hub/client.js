//TODO use EventEmitter where possible
class Client {
	constructor({ uid, send, setAbilities, registerWebHook }) {
		this._uid = uid;
		this._send = send;
		this._setAbilities = setAbilities;
		this._registerWebHook = registerWebHook;
		
		this._eventListeners = {};
		this._onRequestHandler = undefined;
		this._requestResolutionMap = new Map();
	}

	set onRequest(handler) {
		if (this._onRequestHandler) {
			throw new Error('The onRequest handler has already been assigned.');
		}

		this._onRequestHandler = handler;
	}

	set abilities(abilities) { this._setAbilities(abilities); }

	registerWebHook(path, handler) {
		if (!path || typeof handler !== 'function') {
			throw new Error('Bad arguments passed to .registerWebHook().')
		}

		this._registerWebHook(path, handler);
	}

	publish(type, payload = undefined) {
		if (!type) {
			throw new Error('Bad arguments passed to .publish().');
		}

		this._send({ type: 'event', data: payload });
	}

	async request(destination, type, payload = undefined) {
		if (!destination || !type) {
			throw new Error('Bad arguments passed to .request().');
		}

		const requestId = this._generateRequestId();

        const requestPromise = new Promise((resolve, reject) => {
            this._requestResolutionMap.set(requestId, resolve);

            this._send({
				type: 'request',
				destination,
				name: type,
                data: { ...payload, _requestId: requestId }
            });

            setTimeout(() => {
                reject('The request has timed out.');
                this._requestResolutionMap.delete(requestId);
            }, 10000);
        });

        const response = await requestPromise;
        this._requestResolutionMap.delete(requestId);

        return response;
	}

	handleMessage(message) {
		switch (message.type) {
			case 'event':
				this._onEventReceived(message);
				break;

			case 'request':
				this._onRequestReceived(message);
				break;

			case 'response':
				this._onResponseReceived(message);
				break;

			case 'error':
				//TODO error message routing
				
				break;
		}
	}
	
	_generateRequestId() {
        const now = new Date().getTime();
        const modifier = Math.random();
        return Math.ceil(now * modifier).toString(); // this should be unique enough for this purpose
    }

	_onEventReceived(message) {
		const listeners = this._eventListeners[message.name];
        if (typeof listeners === 'object' && listeners.length !== undefined) {
            listeners.forEach(x => x(message));
        }
	}

	async _onRequestReceived(message) {
		if (typeof this._onRequestHandler !== 'function') {
            console.warn('A request was received but no onRequest handler has been set.');
			return;
		}

		if (message.origin === undefined) {
			throw new Error('An invalid message was received.');
		}

		try {
			const response = await Promise.resolve(this._onRequestHandler(message));
			this._send({
				type: 'response',
				destination: message.origin,
				request: message,
				data: response
			});
		} catch (err) {
			this._send({
				type: 'error',
				destination: message.origin,
				request: message,
				data: { message: `A unexpected error occurred during the request: ${err.message}` }
			});
		}
	}

	_onResponseReceived(message) {
		const requestId = message.request.data._requestId;
		const resolveResponse = this._requestResolutionMap.get(requestId);

		if (typeof resolveResponse !== 'function') {
			return;
		}

		resolveResponse(message.data);
		this._requestResolutionMap.delete(requestId);
	}
}

module.exports = Client;
