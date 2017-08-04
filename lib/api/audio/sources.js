const Router = require('koa-router');

const fakeSources = [{
	id: 1,
	slug: 'spotify',
	title: 'Spotify'
}, {
	id: 2,
	slug: 'podcast',
	title: 'Podcast'
}];

const sourcesApi = new Router();

sourcesApi.get('/', async ctx => {
	const sourceModels = [];
	fakeSources.forEach(source => {
		sourceModels.push({
			id: source.id,
			slug: source.slug,
			title: source.title,
			href: ctx.origin + sourcesApi.url('source', source.slug, 'browse')
		})
	});

	ctx.body = JSON.stringify({
		sources: sourceModels
	});
});

sourcesApi.get('source', '/:id', async ctx => {
	ctx.body = JSON.stringify({
		items: [
			{
				id: 1,
				title: 'Playlists',
				href: ctx.origin + sourcesApi.url('playlists', ctx.params.id, 'playlists')
			}
		]
	});
});

sourcesApi.get('playlists', '/:id/playlists', async ctx => {
	ctx.body = '{}';
});

module.exports = sourcesApi;
