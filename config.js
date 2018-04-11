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

config.modules['authentication'] = {
	module: require('./lib/modules/authentication'),
	config: {
		baseUrl: `${config.connection.isSecure ? 'https' : 'http'}://${config.connection.host}:${config.connection.port}`
	}
}

module.exports = config;