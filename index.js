const WebSocket = require('ws');

//https://github.com/websockets/ws
const server = new WebSocket.Server({ port: 3000 });

server.on('connection', client => {
	client.on('message', message => {
		console.log(message);
		client.send(message);
	});
});
