module.exports = {
	connection: {
		port: 9000
	},
	modules: {
		'mopidy': require('./lib/modules/mopidy')
	}
}
