//TODO use EventEmitter
class Node {
	constructor(uid) {
		this.id = uid;
		this._eventHandlers = new Map();
		this._sendMessage = undefined;
	}

	on(eventName, handler) {
		eventName = eventName.toLowerCase();
		const handlers = this._eventHandlers.get(eventName) || [];
		handlers.push(handler);
		this._eventHandlers.set(eventName, handlers);
	}

	send(message) {
		throw new Error('You must implement the send() method when extending Node.');
	}

	ping() {
		throw new Error('You must implement the ping() method when extending Node.');
	}

	destroy() {
		throw new Error('You must implement the destroy() method when extending Node.');
	}

	_raiseEvent(eventName, ...args) {
		const handlers = this._eventHandlers.get(eventName) || [];
		handlers.forEach(handler => handler.apply(handler, args));
	}
}

module.exports = Node;
