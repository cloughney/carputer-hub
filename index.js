const Koa = require('koa');
const route = require('koa-router');

const setupApi = require('./lib/api').setup;
const setupWebSockets = require('./lib/websockets').setup;

let app = new Koa();

app = setupApi(app);
app = setupWebSockets(app);

app.listen(3000);
