const fs = require('fs');

const certPath = process.env['KRIKCO_CERT'];
const certKeyPath = process.env['KRIKCO_CERT_KEY'];

if (!certPath || !certKeyPath) {
	throw new Error('The required SSL environment variables are not configured.');
}

const config = {
	connection: {
		host: 'h.krik.co',
		port: 9000,
		ssl: {
			certificate: fs.readFileSync(certPath),
			key: fs.readFileSync(certKeyPath)
		}
	},
	modules: {}
};

config.modules['spotify.authentication'] = {
	module: require('./lib/modules/spotify-authentication'),
	config: {
		baseUrl: `https://${config.connection.host}:${config.connection.port}`,
		clientId: process.env['SPOTIFY_CLIENT'],
		clientSecret: process.env['SPOTIFY_SECRET']
	}
};

module.exports = config;