const { Client } = require('../../websockets')

class MopidyModule {
	static register() {

	}

	constructor() {
		this._client = new WebSocketClient('module');
		this._client.publish({
			type: 'module.register',
			name: 'mopidy',
			abilities: ['media.audio']
		});

		console.log('mopidy!');
	}
}

module.exports = MopidyModule.register;
