// config.js
let config;

if (__DEV__) {
  config = require('./config.dev'); // Development config
} else {
  config = require('./config.prod'); // Production config
}

export default config;
