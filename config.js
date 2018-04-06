module.exports = {
	connection: {
		port: 9000
	},
	modules: {
		//'mopidy': require('./lib/modules/mopidy'),
		'authentication': {
			type: 'webhook',
			path: '/test',
			module: require('./lib/modules/authentication')
		}
	}
}
