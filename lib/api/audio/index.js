const Router = require('koa-router');
const sourcesApi = require('./sources');

const audioApi = new Router();
audioApi.use('/sources', sourcesApi.routes(), sourcesApi.allowedMethods());

module.exports = audioApi;
