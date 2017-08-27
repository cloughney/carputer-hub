const WebSocket = require('ws');
const { InternalNode, SocketNode, NodeRepository } = require('./nodes');

/* TODO
 * create message factories
 * add incoming message validation
 */
class CommunicationHub {
	constructor(config) {
		this._server = undefined;
		this._nodes = new NodeRepository();
		this._externalNodeCount = 0;
		this._requestMap = new Map();
	}

	listen() {
		if (this._server) {
			throw new Error('The server is already listening.');
		}

		this._server = new WebSocket.Server({ port: 9000 });
		this._server.on('connection', socket => { this._addNode(new SocketNode(`external.${++this._externalNodeCount}`, socket)); });
		this._startPingInterval(10);
		this._startRequestTimeoutInterval(30);
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
		node.on('close', this._removeNode.bind(this, node));
		node.on('abilities', abilities => { this._nodes.updateAbilities(node, abilities); });
	}

	_removeNode(node) {
		console.log('node removed');
		this._nodes.remove(node);
		node.destroy();
	}

	_startPingInterval(pingDelaySeconds) {
		setInterval(() => {
			for (let node of this._nodes) {
				if (node.isAlive === false) {
					return this._removeNode(node);
				}

				node.isAlive = false;
				node.ping('', false, true);
			}
		}, pingDelaySeconds * 1000);
	}

	_startRequestTimeoutInterval(requestTimeoutSeconds) {
		setInterval(() => {
			for (let [requestId, details] of this._requestMap) {
				const secondsSinceSent = (new Date().getTime() - details.sent.getTime()) / 1000;
				if (secondsSinceSent < requestTimeoutSeconds) { continue; }

				const sender = this._nodes.getById(details.message.origin);
				if (!sender) { continue; }

				if (this._requestMap.delete(requestId)) {
					sender.send({
						type: 'error',
						error: { message: 'The request timed out.' },
						originalMessage: details.message
					});
				}
			}
		}, 100);
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
				this._requestMap.set(message.id, {
					message,
					sent: new Date()
				});
				this._routeMessage(message, node);
				break;
			case 'response':
				//only route the response back if it hasn't timed out
				if (this._requestMap.delete(message.id)) {
					this._routeMessage(message, node);
				}
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
