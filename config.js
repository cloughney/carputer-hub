const config = {
	connection: {
		host: 'h.krik.co',
		port: 9000,
		isSecure: false
	},
	modules: {
		//'mopidy': { type: 'client', module: require('./lib/modules/mopidy') },
		
	}
};

config.modules['spotify.authentication'] = {
	module: require('./lib/modules/spotify-authentication'),
	config: {
		baseUrl: `${config.connection.isSecure ? 'https' : 'http'}://${config.connection.host}:${config.connection.port}`,
		clientId: process.env['SPOTIFY_CLIENT'],
		clientSecret: process.env['SPOTIFY_SECRET']
	}
}

module.exports = config;