const config = require('./../config');

let adapter;
if (config.cache.type.toLowerCase() === 'static') {
  adapter = require('./static');
} else if (config.cache.type.toLowerCase() === 'azuresearch') {
  adapter = require('./azureSearch');
} else {
  throw new Error(`Invalid cache type ${config.cache.type} in config`);
}

module.exports = adapter;