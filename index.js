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

	const client = hub.createClient(moduleUid);
	
	const moduleInstance = moduleConfig.module({ client, config });
	modules.push(moduleInstance);
});

hub.listen();
