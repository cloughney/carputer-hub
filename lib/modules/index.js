class ModuleRepository {
	constructor(config, communicationHub) {
		this._client = {};
		this._modules = config.register.map(registerModule => registerModule(this._client));
	}
}

module.exports = {
	ModuleRepository,
	mopidy: require('./mopidy')
}
