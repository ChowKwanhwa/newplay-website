import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://newplay.game',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
