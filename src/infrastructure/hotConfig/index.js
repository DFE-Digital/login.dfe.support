const config = require('./../config');

let adapter;
if (config.hotConfig.type.toLowerCase() === 'api') {
  adapter = require('./api');
} else if (config.hotConfig.type.toLowerCase() === 'static') {
  adapter = require('./static');
} else {
  throw new Error(`Invalid hot config type ${config.hotConfig.type}`);
}

module.exports = adapter;
