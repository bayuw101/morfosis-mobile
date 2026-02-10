const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");



const config = getDefaultConfig(__dirname);

// 1. Remove svg from assetExts
// 2. Add svg to sourceExts
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
};

module.exports = withNativeWind(config, { input: "./global.css" });
