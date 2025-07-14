module.exports = {
  root: true,
  extends: ['airbnb', 'prettier'],
  plugins: ['unused-imports'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Unused imports/vars autofix
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    // Modern JavaScript and best practices
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'prefer-destructuring': [
      'warn',
      { array: true, object: true },
      { enforceForRenamedProperties: false },
    ],
    'prefer-template': 'warn',
    'object-shorthand': ['warn', 'always'],
    'no-var': 'error',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'import/prefer-default-export': 'off',
    // AirBnB and project-specific rules
    'no-console': 'off', // Allow console for debugging
    'no-underscore-dangle': 'off', // Allow dangling underscores
    'no-unused-vars': 'off', // handled by unused-imports
    'import/no-cycle': 'warn',
    'no-param-reassign': ['error', { props: false }],
    'class-methods-use-this': 'warn',
    'no-await-in-loop': 'warn',
    'no-restricted-syntax': 'off',
    'no-plusplus': 'off',
    camelcase: 'off',
    'no-else-return': 'warn',
    'consistent-return': 'warn',
    'no-return-await': 'warn',
    'no-nested-ternary': 'warn',
    'arrow-body-style': 'warn',
    // React Native specific adjustments
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    // React specific
    'react/prop-types': 'off',
    'react/no-unstable-nested-components': 'warn',
    'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }],
    'react/jsx-props-no-spreading': 'off', // Allow prop spreading for wrapper components
    'react/function-component-definition': [
      'warn',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
  },
  env: {
    jest: true,
  },
  globals: {
    __DEV__: 'readonly',
  },
};
