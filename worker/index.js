export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.newplay.game') {
      url.hostname = 'newplay.game';
      url.protocol = 'https:';
      return Response.redirect(url, 308);
    }
    return env.ASSETS.fetch(request);
  },
};
