const config = require('./../config');

let adapter;
if (config.access.type === 'static') {
  adapter = require('./static');
} else if(config.access.type === 'api') {
  adapter = require('./api');
} else {
  throw new Error(`Invalid organisations type ${config.access.type} in config`);
}

module.exports = adapter;
