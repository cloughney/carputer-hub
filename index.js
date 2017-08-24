const WebSocket = require('ws');
const connectionManager = require('./lib/websockets/connection-manager');
const registerMopidy = require('./lib/modules/mopidy');

connectionManager.setServer(new WebSocket.Server({ port: 9000 }));

registerMopidy();
