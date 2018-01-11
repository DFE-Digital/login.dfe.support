const config = require('./../config');

let adapter;
if (config.cache.type.toLowerCase() === 'static') {
  adapter = require('./static');
} else if (config.cache.type.toLowerCase() === 'redis') {
  adapter = require('./redis');
} else {
  throw new Error(`Invalid cache type ${config.cache.type} in config`);
}

module.exports = adapter;