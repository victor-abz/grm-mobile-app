// config.js
let config;

if (__DEV__) {
  config = require('./config.dev/index.js').default; // Development config
} else {
  config = require('./config.prod/index.js').default; // Production config
}

export default config;
