const https = require('https');
const url = require('url');
const querystring = require('querystring');
const request = require('request');
const storage = require('node-persist');

const spotifyClientId = '';
const spotifyClientSecret = '';

const stateCookieKey = 'spotify_auth_state';
const redirectCookieKey = 'spotify_auth_redirect_url';

class OAuthModule {
	constructor(config, client) {
		this._baseUrl = config.baseUrl;
		this._loginPath = '/spotify/login';
		this._callbackPath = '/spotify/callback';

		//TODO centralized state storage to persist this stuff
		this._accessToken = null;
		this._refreshToken = null;
		this._tokenExpiration = null;

		this._client = client;
		this._client.abilities = ['authentication.spotify'];

		this._client.registerWebHook(this._loginPath, this._onLogin.bind(this));
		this._client.registerWebHook(this._callbackPath, this._onLoginCallback.bind(this));

		this._client.onRequest = this._onRequestReceived.bind(this);
		this._requestHandlers = new Map();

		this._requestHandlers.set('spotify.refresh_access_token', async request => {
			if (this._refreshToken === null) {
				return { accessToken: null };
			}

			const isTokenAvailable = !!this._accessToken;
			const isTokenValid = this._tokenExpiration !== null && this.now < this._tokenExpiration;

			if (isTokenAvailable && isTokenValid) {
				return { accessToken: this._accessToken };
			}

			const tokenResponse = await this._requestToken({
				grant_type: 'refresh_token',
				refresh_token: this._refreshToken
			});

			if (tokenResponse.error) {
				throw new Error(tokenResponse.error);
			}

			return { accessToken: tokenResponse.accessToken };
		});
	}

	get now() { return new Date().getTime(); }

	async _onRequestReceived(message) {
		const handler = this._requestHandlers.get(message.name);
		if (!handler) {
			throw new Error(`Invalid request name '${message.name}'.`);
		}

		return await handler(message);
	}

	async _onLogin(req, res) {
		const redirectUrl = this._getValidUrl(req.query.redirect_url || null);
		if (redirectUrl === null) {
			console.log('test');
			res.status(400).end();
			return;
		}

		const state = this._generateState();

		res.cookie(redirectCookieKey, redirectUrl.format());
		res.cookie(stateCookieKey, state);

		const query = querystring.stringify({
			response_type: 'code',
			client_id: spotifyClientId,
			redirect_uri: `${this._baseUrl}${this._callbackPath}`,
			scope: '',
			state
		});

		res.redirect(`https://accounts.spotify.com/authorize?${query}`);
	}

	async _onLoginCallback(req, res) {
		const storedRedirectUrl = req.cookies ? req.cookies[redirectCookieKey] : null;
		const storedState = req.cookies ? req.cookies[stateCookieKey] : null;
		const code = req.query.code || null;
		const state = req.query.state || null;

		console.dir(req.cookies);
		console.dir(req.query);

		const redirectUrl = this._getValidUrl(storedRedirectUrl);
		if (redirectUrl === null) {
			res.status(400).end();
			return;
		}

		const error = req.query.error || null;
		if (error) {
			redirectUrl.search = `error=${error}`;
			res.redirect(redirectUrl.format());
			return;
		}
		
		if (state === null || state !== storedState) {
			redirectUrl.search = 'error=state_mismatch';
			res.redirect(redirectUrl.format());
			return;
		}

		if (code === null) {
			redirectUrl.search = 'error=invalid_response';
			res.redirect(redirectUrl.format());
			return;
		}

		const tokenResponse = await this._requestToken({
			grant_type: 'authorization_code',
			redirect_uri: `${this._baseUrl}${this._callbackPath}`,
			code
		});

		if (tokenResponse.error) {
			redirectUrl.search = `error=${tokenResponse.error}`;
			res.redirect(redirectUrl.format());
			return;
		}

		const { accessToken, refreshToken, accessTokenExpiresIn } = tokenResponse;
		this._saveAccessToken(accessToken, refreshToken, accessTokenExpiresIn);

		redirectUrl.search = querystring.stringify({ accessToken });
		console.log(redirectUrl.format());

		res.redirect(redirectUrl.format());
	}

	_requestToken(params, redirectUrl) {
		const encryptedClientInfo = new Buffer(`${spotifyClientId}:${spotifyClientSecret}`).toString('base64');
		const requestOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: params,
			json: true,
			headers: {
				'Authorization': `Basic ${encryptedClientInfo}`
			}
		};

		return new Promise((resolve, reject) => {
			request.post(requestOptions, (err, tokenResponse, body) => {
				if (err) {
					return reject('token_error');
				}
	
				const { access_token, expires_in, refresh_token } = body;
				resolve({ 
					accessToken: access_token,
					accessTokenExpiresIn: expires_in,
					refreshToken: refresh_token
				});
			});
		});
	}

	_saveAccessToken(accessToken, refreshToken, expiresIn) {
		this._accessToken = accessToken;
		this._refreshToken = refreshToken;

		const expirationWindow = 90; // seconds
		const expiration = this.now + expiresIn - expirationWindow;
		this._tokenExpiration = expiration;
	}

	_generateState() {
		let output = '';

		const length = 16;
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (let i = 0; i < length; i++) {
			output += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return output;
	}

	_getValidUrl(testUrl) {
		try {
			return url.parse(testUrl);
		} catch (err) {
			return null;
		}
	}
}

const registerModule = context => {
	return new OAuthModule(context.config, context.client);
};

module.exports = registerModule;
