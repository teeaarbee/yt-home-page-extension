import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage'],
    host_permissions: ['https://www.youtube.com/*'],
    name: 'YouTube Watch Later Homepage',
    description: 'Replaces YouTube homepage with Watch Later videos',
  },
});
