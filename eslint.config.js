const globals = require("globals");
const pluginJest = require("eslint-plugin-jest");
const pluginJs = require("@eslint/js");

module.exports = [
  {
    plugins: {
      jest: pluginJest,
    },
  },

  pluginJs.configs.recommended,

  {
    ignores: ["coverage/**", "build/**", "dist/**"],
  },

  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "commonjs",
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },
    rules: {
      strict: ["error", "never"],
    },
  },

  {
    files: ["test/**/*.js", "**/*.test.js"],
    languageOptions: {
      globals: {
        ...pluginJest.environments.globals.globals,
      },
    },
  },
];
