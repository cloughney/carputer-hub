const { Client } = require('../../websockets')

class MopidyModule {
	static register() {
		const module = new MopidyModule();
	}

	constructor() {
		this._client = new Client('module');

		this._client.connect();
		this._client.onConnect = () => {
			this._client.post({
				type: 'event',
				id: 'module.register',
				data: {
					abilities: ['media.audio']
				}
			});
		};

		this._client.onEvent = message => {
			console.dir(message);
		};

		console.log('mopidy!');
	}
}

module.exports = MopidyModule.register;
