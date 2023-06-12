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
      return webpackConfig;
    },
  },
};
