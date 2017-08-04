const Koa = require('koa');

const api = require('./lib/api');
const setupWebSockets = require('./lib/websockets').setup;

let app = new Koa();

app.use(api.routes()).use(api.allowedMethods())

app = setupWebSockets(app);

app.listen(3000);
