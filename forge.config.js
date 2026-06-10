module.exports = {
  packagerConfig: {
    asar: true,
    name: 'PrismWall',
    icon: './assets/tray-icon',
  },

  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: { name: 'PrismWall' },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: { name: 'PrismWall' },
    },
  ],

  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main/main.js',
            config: 'vite.main.config.js',
          },
          {
            entry: 'src/main/preload.js',
            config: 'vite.preload.config.js',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.js',
          },
        ],
      },
    },
  ],
};