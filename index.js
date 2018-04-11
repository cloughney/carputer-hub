const WebSocket = require('ws');
const config = require('./config');
const { CommunicationHub } = require('./lib/hub');
//const { ModuleRepository } = require('./lib/modules');

const hub = new CommunicationHub(config);
//const modules = new ModuleRepository(config.modules, hub);

const modules = [];
Object.getOwnPropertyNames(config.modules).forEach(moduleKey => {
	const moduleSection = config.modules[moduleKey];
	const moduleUid = `module.${moduleKey}`;

	const client = hub.createClient(moduleUid);
	
	const moduleInstance = moduleSection.module({ client, config: moduleSection.config });
	modules.push(moduleInstance);
});

hub.listen(config.connection.port);
