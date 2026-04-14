// @ts-check
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          modules: true,
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always'],
      'curly': 'warn',
      'no-multiple-empty-lines': 'warn',
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/generated/**',
      '*.config.js',
    ],
  },
];