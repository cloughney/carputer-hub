const WebSocket = require('ws');
const config = require('./config');
const { CommunicationHub } = require('./lib/hub');
//const { ModuleRepository } = require('./lib/modules');

const hub = new CommunicationHub(config);
//const modules = new ModuleRepository(config.modules, hub);

const modules = [];
Object.getOwnPropertyNames(config.modules).forEach(moduleKey => {
	const moduleConfig = config.modules[moduleKey];
	const moduleUid = `module.${moduleKey}`;

	let client = undefined;

	switch (moduleConfig.type.toLowerCase()) {
		case 'client':
			client = hub.createClient(moduleUid);
			break;
		case 'webhook':
			client = hub.createWebHook(moduleUid, moduleConfig.path);
			break;
		default:
			throw new Error(`Invalid module type '${moduleConfig.type}' for module '${moduleKey}'.`);
	}

	const moduleInstance = moduleConfig.module({ client, config });
	modules.push(moduleInstance);
});

hub.listen();
