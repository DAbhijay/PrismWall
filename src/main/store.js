// Single source of truth for all persisted config.
// electron-store writes this to a JSON file in the OS app data folder:
//   Windows: C:\Users\<user>\AppData\Roaming\prismwall\config.json
//   macOS:   ~/Library/Application Support/prismwall/config.json
//
// The schema validates every read/write so you never get undefined
// crashing the app when a new field is added in a future version.

const Store = require('electron-store');

const store = new Store({
  name: 'config',
  schema: {

    mode: {
      type: 'string',
      enum: ['day', 'night'],
      default: 'day',
    },

    wallpapers: {
      type: 'object',
      default: {},
      properties: {
        dayDefault:   { type: ['string', 'null'], default: null },
        dayMedia:     { type: ['string', 'null'], default: null },
        nightDefault: { type: ['string', 'null'], default: null },
        nightMedia:   { type: ['string', 'null'], default: null },
      },
    },

    xray: {
      type: 'object',
      default: {},
      properties: {
        enabled:     { type: 'boolean', default: false },
        topLayer:    { type: ['string', 'null'], default: null },
        bottomLayer: { type: ['string', 'null'], default: null },
        opacity:     { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
      },
    },

    // Global keybind — user can change this in Settings later
    keybind: {
      type: 'string',
      default: 'CommandOrControl+Shift+W',
    },

    // Whether to check for updates on launch
    autoUpdate: {
      type: 'boolean',
      default: true,
    },
  },
});

module.exports = store;
