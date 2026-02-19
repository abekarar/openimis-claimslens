const { createProxyMiddleware } = require('http-proxy-middleware');
const packageJson = require('../package.json');

module.exports = function (app) {
  // API proxy: strip /api prefix so /api/graphql → /graphql on the backend
  const apiTarget = process.env.API_PROXY_TARGET || 'http://backend:8000';
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
      logLevel: 'debug',
    })
  );
  console.log(`API proxy set up: /api → ${apiTarget} (stripping /api prefix)`);

  // Now load any static proxies from package.json (like opensearch)
  const proxyConfig = packageJson.proxies;
  if (proxyConfig && typeof proxyConfig === 'object') {
    Object.entries(proxyConfig).forEach(([key, value]) => {
      if (key === 'api') return; // handled above
      const base = value.base;
      const target = value.target;
      const newBase = value.newBase ?? value.base;

      if (base && target) {
        app.use(
          base,
          createProxyMiddleware({
            target,
            changeOrigin: true,
            pathRewrite: {
              [`^${base}`]: `${newBase}`,
            },
            logLevel: 'debug',
          })
        );
        console.log(`Proxy set up for [${key}]: ${base} → ${target}`);
      }
    });
  }
};
