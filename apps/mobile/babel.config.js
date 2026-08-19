module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Unistyles 3 rewrites styled components to depend on the native Nitro module.
      // `root` scopes processing to our source tree. This is why the app requires a
      // dev build and crashes in Expo Go (see docs/design-system.md §2).
      ['react-native-unistyles/plugin', { root: 'src' }],
      // babel-preset-expo auto-adds react-native-worklets/plugin (reanimated 4) last.
    ],
  };
};
