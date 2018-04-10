const https = require('https');
const querystring = require('querystring');
const request = require('request');

const spotifyClientId = '';
const spotifyClientSecret = '';

class OAuthModule {
	constructor(client) {
		this._client = client;
		this._client.onRequest = this._onRequestReceived.bind(this);
		this._client.registerWebHook('/spotify/callback', this._onAuthenticationCallback.bind(this));
		this._client.abilities = ['authentication.spotify'];

		this._requestHandlers = new Map();

		this._requestHandlers.set('spotify.refresh_access_token', async request => {
			return { data: { accessToken: null } };
		});

		this._requestHandlers.set('spotify.get_authentication_details', async request => {
			//TODO get redirect url (to return to app) from this request
			// store it in a Map and use it as the res.redirect when the /callback is hit

			//

			const data = {
				client_id: spotifyClientId,
				redirect_uri: 'http://h.krik.co:9000/spotify/callback',
				state: 'jibberish'
			};

			return { data };
		});
	}

	async _onRequestReceived(message) {
		const handler = this._requestHandlers.get(message.name);
		if (!handler) {
			throw new Error(`Invalid request name '${message.name}'.`);
		}

		return await handler(message);
	}

	async _onAuthenticationCallback(req, res) {
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
			if (err) {
				res.redirect('http://localhost:8080/#/audio/spotify/connect/error');
			}

			const { access_token, expires_in } = body;
			const queryString = querystring.stringify({ access_token, expires_in });
			res.redirect(`http://localhost:8080/?${queryString}#/audio/spotify/connect`);
		});
	}
}

const registerModule = context => {
	return new OAuthModule(context.client);
};

module.exports = registerModule;
