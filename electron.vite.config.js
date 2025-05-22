const { defineConfig } = require("electron-vite")

module.exports = defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: "src/main/index.js",
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: "src/preload/index.js",
        },
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          index: "src/renderer/index.html",
        },
      },
    },
  },
})
