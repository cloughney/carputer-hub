class OAuthModule {
	constructor(client) {
		this._client = client;
		this._client.onRequestReceived = this._onRequestReceived.bind(this);
		this._client.onWebHookReceived = this._onWebHookReceived.bind(this);
		this._client.abilities = ['authentication.spotify'];

		this._requestHandlers = new Map();
		this._requestHandlers.set('authentication.spotify.authorize', async request => {
			return { data: { test: true } };
		});
	}

	async _onRequestReceived(message) {
		// const handler = this._requestHandlers.get(request.name);
		// if (!handler) {
		// 	throw new Error(`Invalid request name '${request.name}'.`);
		// }
	}

	async _onWebHookReceived(request, response) {
		response.send('test');
	}
}

const registerModule = context => {
	return new OAuthModule(context.client);
};

module.exports = registerModule;
