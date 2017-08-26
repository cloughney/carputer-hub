const WebSocket = require('ws');
const config = require('./config');
const { CommunicationHub } = require('./lib/hub');
//const { ModuleRepository } = require('./lib/modules');

const hub = new CommunicationHub({});
//const modules = new ModuleRepository(config.modules, hub);

const modules = config.modules.register
	.map(registerModule => registerModule({ getClient: hub.getClient.bind(hub) }));

hub.listen();
