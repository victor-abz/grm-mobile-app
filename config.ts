let config;

if (__DEV__) {
  config = require('./config.dev').config; // Development config  
} else {
  config = require('./config.prod').config; // Production config
}

export default config;
