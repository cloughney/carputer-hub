const express = require('express');
const WebSocket = require('ws');
const { InternalNode, InternalWebHookNode, SocketNode, NodeRepository } = require('./nodes');
const Client = require('./client');

class HubClient {
	constructor(client, nodeRepo) {
		this._client = client;
		this._client.onRequestReceived = this._onRequestReceived.bind(this);
		//this._client.abilities = [''];

		this._nodes = nodeRepo;

		this._requestHandlers = new Map();
		this._requestHandlers.set('media.audio.listSources', request => {
			const nodes = this._nodes.getByAbility('media.audio.source') || [];
			return { data: { modules: nodes.map(node => node.id) } };
		});
	}

	async _onRequestReceived(request) {
		const handler = this._requestHandlers.get(request.name);
		if (!handler) {
			throw new Error(`Invalid request name '${request.name}'.`);
		}

		return await Promise.resolve(handler(request));
	}
}

/* TODO
 * create message factories
 * add incoming message validation
 */
class CommunicationHub {
	constructor(config) {
		this._isListening = false;
		this._httpServer = express();
		this._socketServer = new WebSocket.Server({ server: this._httpServer });
		this._nodes = new NodeRepository();
		this._externalNodeCount = 0;
		this._requestMap = new Map();
		this._client = new HubClient(this.createClient('hub'), this._nodes);
	}

	listen(port = 9000) {
		if (this._isListening) {
			throw new Error('The server is already listening.');
		}

		this._socketServer.on('connection', socket => { this._addNode(new SocketNode(`external.${++this._externalNodeCount}`, socket)); });

		this._httpServer.listen(port, () => {
			this._startPingInterval(10);
			this._startRequestTimeoutInterval(30);

			this._isListening = true;
		});
	}

	createClient(uid) {
		const clientNode = new InternalNode(uid);
		this._addNode(clientNode);
		return clientNode.client;
	}

	createWebHook(uid, path) {
		const clientNode = new InternalWebHookNode(uid);

		this._httpServer.use(path, clientNode.sendWebHook.bind(clientNode));

		this._addNode(clientNode);
		return clientNode.client;
	}

	_addNode(node) {
		console.log('new node attached');
		this._nodes.add(node);
		node.on('message', this._handleMessage.bind(this, node));
		node.on('pong', () => { node.isAlive = true; });
		node.on('close', this._removeNode.bind(this, node));
		node.on('abilities', abilities => { this._nodes.setAbilities(node, abilities); });
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
					sender.sendMessage({
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
			case 'error':
				console.log(message.originalMessage);
				switch (message.originalMessage.type) {
					case 'request':
						if (this._requestMap.delete(message.originalMessage.id)) {
							this._routeMessage(message, node);
						}
						break;
				}
				break;
			default:
				throw new Error(`Received an invalid message type: '${message.type}'.`)
		}
	}

	_broadcastEvent(event, sender) {
		for (let node of this._nodes) {
			if (node !== sender) {
				node.sendMessage(event);
			}
		}
	}

	_routeMessage(message, sender) {
		const node = this._nodes.getById(message.destination);
		if (!node) {
			sender.sendMessage({
				type: 'error',
				error: { message: `Could not find a node with an ID matching the destination (${message.destination}).` },
				originalMessage: message
			});
			return;
		}

		node.sendMessage(message);
	}
}

module.exports = CommunicationHub;
