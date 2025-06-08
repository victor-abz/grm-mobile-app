module.exports = {
  root: true,
  extends: ['@react-native-community', 'prettier'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Disable overly strict rules for development
    'no-console': 'warn', // Allow console logs but warn
    'no-alert': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-cycle': 'warn', // Reduce to warning instead of error
    'no-param-reassign': ['error', { props: false }], // Allow property assignment
    'class-methods-use-this': 'warn', // Reduce to warning
    'no-await-in-loop': 'warn', // Allow await in loops with warning
    'no-restricted-syntax': 'off', // Allow for-of loops
    'no-plusplus': 'off', // Allow ++ operator
    camelcase: 'warn', // Reduce camelcase requirement to warning
    'no-else-return': 'warn',
    'consistent-return': 'warn',
    'no-return-await': 'warn',
    'no-nested-ternary': 'warn',
    'arrow-body-style': 'warn',

    // React Native specific adjustments
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'off', // Allow inline styles for development
    'react-native/no-color-literals': 'off',

    // React specific
    'react/prop-types': 'off', // We're using TypeScript for props
    'react/no-unstable-nested-components': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    'react-native/react-native': true,
    jest: true,
  },
  globals: {
    __DEV__: 'readonly',
  },
};
