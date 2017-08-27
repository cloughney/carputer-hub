class MopidyModule {
	constructor(client) {
		this._client = client;
		this._client.onEventReceived = this.onEventReceived.bind(this);
		this._client.onRequestReceived = this.onRequestReceived.bind(this);
	}

	onEventReceived(event) {
		console.dir(event);
	}

	async onRequestReceived(request) {
		console.dir(request);
		if (request.name === 'timeout') {
			return await new Promise(resolve => setTimeout(resolve, 60000));
		}
	}
}

const moduleAbilities = ['media.audio'];
module.exports = context => new MopidyModule(context.client);
