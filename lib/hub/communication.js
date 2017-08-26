const WebSocket = require('ws');
const { InternalNode, SocketNode, NodeRepository } = require('./nodes');

class CommunicationHub {
	constructor(config) {
		this._server = undefined;
		this._pingInterval = undefined;
		this._nodes = new NodeRepository();
	}

	listen() {
		if (this._server) {
			throw new Error('The server is already listening.');
		}

		this._server = new WebSocket.Server({ port: 9000 });
		this._server.on('connection', socket => { this._addNode(new SocketNode(socket)); });
		this._pingInterval = this._startPingInterval(10);
	}

	getClient(abilities) {
		const clientNode = new InternalNode(abilities);
		this._addNode(clientNode);
		return clientNode.client;
	}

	_addNode(node) {
		console.log('new node attached');
		this._nodes.add(node);
		node.on('message', this._handleMessage.bind(this, node));
		node.on('pong', () => { node.isAlive = true; });
	}

	_removeNode(node) {
		console.log('node removed');
		this._nodes.remove(node);
		node.destroy();
	}

	_startPingInterval(pingDelaySeconds) {
		return setInterval(() => {
			for (let node of this._nodes) {
				if (node.isAlive === false) {
					return this._removeNode(node);
				}

				node.isAlive = false;
				node.ping('', false, true);
			}
		}, pingDelaySeconds * 1000);
	}

	_handleMessage(node, message) {
		message = JSON.parse(message);
		message.type = message.type.toLowerCase();
		console.dir(message);

		switch (message.type) {
			case 'event':
				this._broadcastEvent(message, node);
				break;
			case 'request':

				break;
			case 'response':

				break;
			default:
				throw new Error(`Received an invalid message type: '${message.type}'.`)
		}
	}

	_broadcastEvent(event, sender) {
		for (let node of this._nodes) {
			if (node !== sender) {
				node.send(event);
			}
		}
	}
}

module.exports = CommunicationHub;
