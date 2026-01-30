module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Fix CRA #11770
      const rules = webpackConfig.module.rules;
      for (const rule of rules) {
        if (Object.hasOwn(rule, 'oneOf')) {
          rule.oneOf.filter((currentValue, index, arr) => {
            const toRemove =
              currentValue.test instanceof RegExp && currentValue.test.test('something.svg');
            if (toRemove) {
              arr.splice(index, 1);
            }
            return toRemove;
          });
          rule.oneOf.push({
            test: /\.svg$/i,
            issuer: {
              and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
            },
            type: 'asset',
          });
        }
      }
      webpackConfig.module.noParse = /\/node_modules\/@hotosm\/id\/dist\/iD.min.js/;

      /**
       * CI build fix:
       *
       * @osm-sandbox/sandbox-id (and related iD / Rapid dependencies)
       * use dynamic `require()` internally (e.g. for locales, sprites, plugins).
       *
       * Webpack cannot statically analyze these requires and emits
       * "Critical dependency" warnings.
       *
       * In CI (CI=true), CRA treats warnings as errors, causing the build to fail.
       *
       * These warnings originate from third-party dependencies, not from
       * application code, and are safe to ignore.
       */
      webpackConfig.ignoreWarnings = [
        /Critical dependency: require function is used in a way/,
        /the request of a dependency is an expression/,
        /@osm-sandbox\/sandbox-id/,
      ];

      return webpackConfig;
    },
  },
};
