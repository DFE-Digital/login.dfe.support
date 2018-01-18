const config = require('./../config');

let adapter;
if (config.directories.type === 'static') {
  adapter = require('./static');
} else if (config.directories.type === 'api') {
  adapter = require('./api');
} else {
  throw new Error(`Invalid directories type ${config.directories.type} in config`);
}

module.exports = adapter;
