module.exports = {
	connection: {
		port: 9000
	},
	modules: {
		//'mopidy': { type: 'client', module: require('./lib/modules/mopidy') },
		'authentication': {
			type: 'webhook',
			path: '/test',
			module: require('./lib/modules/authentication')
		}
	}
}
