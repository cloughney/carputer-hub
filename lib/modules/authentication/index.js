const https = require('https');
const querystring = require('querystring');
const request = require('request');

const spotifyClientId = '';
const spotifyClientSecret = '';

class OAuthModule {
	constructor(client) {
		this._client = client;
		this._client.onRequestReceived = this._onRequestReceived.bind(this);
		this._client.registerWebHook('/spotify/callback', this._onWebHookReceived.bind(this));
		this._client.abilities = ['authentication.spotify'];

		this._requestHandlers = new Map();

		this._requestHandlers.set('authentication.spotify.authorize', async request => {
			const data = {
				client_id: spotifyClientId,
				state: 'jibberish'
			};

			return { data };
		});
	}

	async _onRequestReceived(message) {
		const handler = this._requestHandlers.get(request.name);
		if (!handler) {
			throw new Error(`Invalid request name '${request.name}'.`);
		}

		handler(message);
	}

	async _onWebHookReceived(req, res) {
		console.log('WebHook: /spotify/callback');

		const code = req.query.code;

		const requestOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				grant_type: 'authorization_code',
				client_id: spotifyClientId,
				client_secret: spotifyClientSecret,
				code,
				redirect_uri: 'http://h.krik.co:9000/spotify/callback'
			},
			json: true
		};

		request.post(requestOptions, (err, tokenResponse, body) => {
			if (err) { res.redirect('https://google.com?q=Why did my app error out?!'); }

			const queryString = querystring.stringify(body);
			res.redirect(`http://localhost:8080/?${queryString}#/audio/spotify/connect`);
		});
	}
}

const registerModule = context => {
	return new OAuthModule(context.client);
};

module.exports = registerModule;
