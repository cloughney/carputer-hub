const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
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
		
		this._httpApp = express();
		this._httpApp.use(bodyParser.json());

		this._httpServer = http.createServer(this._httpApp);
		this._socketServer = new WebSocket.Server({ server: this._httpServer });
		
		this._nodes = new NodeRepository();
		this._externalNodeCount = 0;
		this._client = new HubClient(this.createClient('hub'), this._nodes); // TODO remove?
	}

	listen(port = 9000) {
		if (this._isListening) {
			throw new Error('The server is already listening.');
		}

		this._socketServer.on('connection', socket => { this._addNode(new SocketNode(`external.${++this._externalNodeCount}`, socket)); });

		this._httpServer.listen(port, () => {
			this._startPingInterval(10);

			this._isListening = true;
		});
	}

	createClient(uid) {
		const clientNode = new InternalNode(uid, {
			registerWebHook: (path, handler) => this._httpApp.use(path, handler)
		});

		this._addNode(clientNode);
		return clientNode.client;
	}

	_addNode(node) {
		console.log(`A new node has attached: '${node.id}'.`);
		//TODO check for duplicate UID

		this._nodes.add(node);
		node.on('message', this._handleMessage.bind(this, node));
		node.on('pong', () => { node.isAlive = true; });
		node.on('close', this._removeNode.bind(this, node));
		node.on('abilities', abilities => { this._nodes.setAbilities(node, abilities); });
	}

	_removeNode(node) {
		console.log(`A node has detatched: '${node.id}.`);

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

	_handleMessage(node, message) {
		message.origin = node.id;
		//TODO message validation all up in here

		switch (message.type) {
			case 'event':
				this._broadcastEvent(message, node);
				break;
			case 'request':
			case 'response':
			case 'error':
				this._routeMessage(message, node);
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
		if (node !== undefined) {
			node.sendMessage(message);
			return;
		}

		sender.sendMessage({
			type: 'error',
			error: { message: `Could not find a node with an ID matching the destination (${message.destination}).` },
			originalMessage: message
		});
	}
}

module.exports = CommunicationHub;
