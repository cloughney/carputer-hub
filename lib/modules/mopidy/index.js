class MopidyModule {
	constructor(client) {
		this._client = client;
		this._client.onEventReceived = this.onEventReceived.bind(this);
		this._client.onRequestReceived = this.onRequestReceived.bind(this);
	}

	onEventReceived(event) {
		console.dir(event);
	}

	onRequestReceived(request) {
		console.dir(request);
	}
}

const moduleAbilities = ['media.audio'];
module.exports = context => new MopidyModule(context.getClient(moduleAbilities));
