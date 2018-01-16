const config = require('./../config');

let adapter;
if (config.organisations.type === 'static') {
  adapter = require('./static');
} else {
  throw new Error(`Invalid organisations type ${config.directories.type} in config`);
}

module.exports = adapter;
