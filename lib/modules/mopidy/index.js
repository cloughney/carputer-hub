const Mopidy = require('mopidy');

class MopidyModule {
	constructor(config, client) {
		this._client = client;
		this._client.onRequestReceived = this._onRequestReceived.bind(this);
		this._client.abilities = ['media.audio.source', 'media.audio.playback'];

		this._isModuleOnline = false;
		this._mopidy = new Mopidy({ webSocketUrl: config.webSocketUrl });
		this._mopidy.on(this._onMopidyEventReceived.bind(this));

		this._requestHandlers = new Map();
		this._requestHandlers.set('media.audio.source.listPlaylists', async request => {
			if (this._isModuleOnline) {
				const playlists = await this._mopidy.playlists.getPlaylists();
				return { data: { playlists } };
			} else {
				return { data: { playlists: [] } };
			}
		});
	}

	_onMopidyEventReceived(eventName, ...args) {
		switch (eventName) {
			case 'state:online':
				if (!this._isModuleOnline) {
					this._isModuleOnline = true;
					this._client.publish({ name: 'module.online' });
				}
				break;
			case 'state:offline':
				if (this._isModuleOnline) {
					this._isModuleOnline = false;
					this._client.publish({ name: 'module.offline' });
				}
				break;
		}
	}

	async _onRequestReceived(request) {
		const handler = this._requestHandlers.get(request.name);
		if (!handler) {
			throw new Error(`Invalid request name '${request.name}'.`);
		}

		return await Promise.resolve(handler(request));
	}
}

const registerModule = context => {
	//TODO load config

	return new MopidyModule({ webSocketUrl: 'ws://192.168.1.153:6680/mopidy/ws' }, context.client);
};

module.exports = registerModule;
