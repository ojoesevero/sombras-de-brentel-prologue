const { defineConfig } = require('vite');

module.exports = defineConfig({
  base: './',
  server: {
    port: 3000,
    strictPort: true
  }
});
