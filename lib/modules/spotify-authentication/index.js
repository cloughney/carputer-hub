const https = require('https');
const url = require('url');
const querystring = require('querystring');
const request = require('request');

const stateCookieKey = 'spotify_auth_state';
const redirectCookieKey = 'spotify_auth_redirect_url';

const EVENT_TOKEN_REFRESHED = 'spotify.access_token_refreshed';
const REQUEST_REFRESH_TOKEN = 'spotify.refresh_access_token';

class SpotifyAuthenticationModule {
	constructor({ config, client }) {
		this._baseUrl = config.baseUrl;
		this._clientId = config.clientId;
		this._clientSecret = config.clientSecret;

		this._authPath = '/spotify/login';
		this._authCallbackPath = '/spotify/callback';

		//TODO centralized state storage to persist this stuff
		this._accessToken = null;
		this._refreshToken = null;
		this._tokenExpiration = null;

		this._client = client;
		this._client.abilities = ['authentication.spotify'];

		this._client.registerWebHook(this._authPath, this._authenticate.bind(this));
		this._client.registerWebHook(this._authCallbackPath, this._authenticateCallback.bind(this));

		this._client.onRequest = this._onRequestReceived.bind(this);
		this._requestHandlers = new Map();
		this._requestHandlers.set(REQUEST_REFRESH_TOKEN, this._refreshAccessToken.bind(this));
	}

	get _now() { return new Date().getTime(); }

	get _callbackRedirectUrl() { return `${this._baseUrl}${this._authCallbackPath}`; }

	async _onRequestReceived(message) {
		const handler = this._requestHandlers.get(message.name);
		if (!handler) {
			throw new Error(`Invalid request name '${message.name}'.`);
		}

		return await handler(message);
	}

	async _refreshAccessToken({ force }) {
		if (this._refreshToken === null) {
			return { accessToken: null };
		}

		const isTokenAvailable = !!this._accessToken;
		const isTokenValid = this._tokenExpiration !== null && this._now < this._tokenExpiration;

		if (isTokenAvailable && isTokenValid && !force) {
			return { accessToken: this._accessToken };
		}

		const tokenResponse = await this._requestToken({
			grant_type: 'refresh_token',
			refresh_token: this._refreshToken
		});

		if (tokenResponse.error) {
			throw new Error(tokenResponse.error);
		}

		const { accessToken, accessTokenExpiresIn } = tokenResponse;
		this._saveAccessToken(accessToken, this._refreshToken, accessTokenExpiresIn);

		return { accessToken: tokenResponse.accessToken };
	}

	async _authenticate(req, res) {
		const redirectUrl = this._getValidUrl(req.query.redirect_url);
		if (redirectUrl === null) {
			res.status(400).end();
			return;
		}

		const state = this._generateState();

		res.cookie(redirectCookieKey, redirectUrl.format());
		res.cookie(stateCookieKey, state);

		const search = querystring.stringify({
			response_type: 'code',
			client_id: this._clientId,
			redirect_uri: this._callbackRedirectUrl,
			scope: 'streaming user-read-birthdate user-read-email user-read-private',
			state
		});

		res.redirect(`https://accounts.spotify.com/authorize?${search}`);
	}

	async _authenticateCallback(req, res) {
		const storedRedirectUrl = req.cookies ? req.cookies[redirectCookieKey] : null;
		const storedState = req.cookies ? req.cookies[stateCookieKey] : null;

		const code = req.query.code || null;
		const state = req.query.state || null;
		const error = req.query.error || null;

		res.clearCookie(stateCookieKey);
		res.clearCookie(redirectCookieKey);

		const redirectUrl = this._getValidUrl(storedRedirectUrl);
		if (redirectUrl === null) {
			return res.status(400).end();
		}

		if (error) {
			this._setRedirectParams(redirectUrl, { error });
			return res.redirect(redirectUrl.format());
		}
		
		if (state === null || state !== storedState) {
			this._setRedirectParams(redirectUrl, { error: 'state_mismatch' });
			return res.redirect(redirectUrl.format());
		}

		if (code === null) {
			this._setRedirectParams(redirectUrl, { error: 'bad_response' });
			return res.redirect(redirectUrl.format());
		}

		const tokenResponse = await this._requestToken({
			grant_type: 'authorization_code',
			redirect_uri: this._callbackRedirectUrl,
			code
		});

		if (tokenResponse.error) {
			this._setRedirectParams(redirectUrl, { error: tokenResponse.error });
			return res.redirect(redirectUrl.format());
		}

		const { accessToken, refreshToken, accessTokenExpiresIn } = tokenResponse;
		this._saveAccessToken(accessToken, refreshToken, accessTokenExpiresIn);

		this._setRedirectParams(redirectUrl, { accessToken });
		res.redirect(redirectUrl.format());
	}

	_requestToken(params, redirectUrl) {
		const encryptedClientInfo = new Buffer(`${this._clientId}:${this._clientSecret}`).toString('base64');
		const requestOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: params,
			json: true,
			headers: { 'Authorization': `Basic ${encryptedClientInfo}` }
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
		this._tokenExpiration = this._now - expirationWindow + (expiresIn * 1000);

		const timeToNextToken = this._tokenExpiration - this._now;
		setTimeout(this._autoUpdateToken.bind(this), timeToNextToken);
	}

	async _autoUpdateToken() {
		try {
			const { accessToken } = await this._refreshAccessToken({ force: true });
			if (accessToken !== null) {
				this._client.publish(EVENT_TOKEN_REFRESHED, { accessToken });
			}
		} catch (err) {
			console.error(err);
		}
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

	_setRedirectParams(redirectUrl, params) {
		let hash = redirectUrl.hash;
		hash = hash !== null
			? hash.endsWith('/') ? hash : `${hash}/`
			: '#/';

		redirectUrl.hash = `${hash}?${querystring.stringify(params)}`;
	}
}

const registerModule = context => {
	return new SpotifyAuthenticationModule(context);
};

module.exports = registerModule;
