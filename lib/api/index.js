const Router = require('koa-router');
const audioApi = require('./audio');

const api = new Router({ prefix: '/api' });

api.use('/audio', audioApi.routes(), audioApi.allowedMethods());

module.exports = api;
