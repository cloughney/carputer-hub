const WebSocket = require('ws');
const { connectionManager } = require('./lib/websockets');

connectionManager.setServer(new WebSocket.Server({ port: 9000 }));

require('./lib/modules/mopidy')();
