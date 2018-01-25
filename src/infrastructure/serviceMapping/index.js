const config = require('./../config');

let adapter;
if (config.serviceMapping.type === 'static') {
  adapter = require('./static');
} else if (config.serviceMapping.type === 'redis') {
  adapter = require('./redis');
} else {
  throw new Error(`Invalid service mapping type ${config.serviceMapping.type} in config`);
}

module.exports = adapter;