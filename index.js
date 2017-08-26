const WebSocket = require('ws');
const config = require('./config');
const { CommunicationHub } = require('./lib/hub');
//const { ModuleRepository } = require('./lib/modules');

const hub = new CommunicationHub({});
//const modules = new ModuleRepository(config.modules, hub);

const modules = [];
for (let moduleKey in config.modules) {
	const context = {
		client: hub.getClient(`module.${moduleKey}`)
	};

	config.modules[moduleKey](context);
}

hub.listen();
