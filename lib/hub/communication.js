const WebSocket = require('ws');
const { InternalNode, SocketNode, NodeRepository } = require('./nodes');

class CommunicationHub {
	constructor(config) {
		this._server = undefined;
		this._pingInterval = undefined;
		this._nodes = new NodeRepository();
		this._externalNodeCount = 0;
	}

	listen() {
		if (this._server) {
			throw new Error('The server is already listening.');
		}

		this._server = new WebSocket.Server({ port: 9000 });
		this._server.on('connection', socket => { this._addNode(new SocketNode(`external.${++this._externalNodeCount}`, socket)); });
		this._pingInterval = this._startPingInterval(10);
	}

	getClient(uid) {
		const clientNode = new InternalNode(uid);
		this._addNode(clientNode);
		return clientNode.client;
	}

	_addNode(node) {
		console.log('new node attached');
		this._nodes.add(node);
		node.on('message', this._handleMessage.bind(this, node));
		node.on('pong', () => { node.isAlive = true; });
		node.on('abilities', abilities => { this._nodes.updateAbilities(node, abilities); });
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
		message.type = message.type.toLowerCase();
		message.origin = node.id;
		//TODO message validation all up in here

		switch (message.type) {
			case 'event':
				this._broadcastEvent(message, node);
				break;
			case 'request':
			case 'response':
				this._routeMessage(message, node);
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

	_routeMessage(message, sender) {
		// if (request.destination === 'hub') {
		// 	_handleHubRequest(request, sender);
		// 	return;
		// }

		const node = this._nodes.getById(message.destination);
		if (!node) {
			sender.send({
				type: 'error',
				error: { message: `Could not find a node with an ID matching the destination (${message.destination}).` },
				originalMessage: message
			});
			return;
		}

		node.send(message);
	}
}

module.exports = CommunicationHub;
