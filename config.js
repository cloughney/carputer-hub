module.exports = {
	connection: {
		port: 9000
	},
	modules: {
		//'mopidy': { type: 'client', module: require('./lib/modules/mopidy') },
		'authentication': {
			module: require('./lib/modules/authentication')
		}
	}
}
