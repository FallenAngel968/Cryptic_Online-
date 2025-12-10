const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable the cache to fix reanimated issues
config.resetCache = true;

module.exports = config;