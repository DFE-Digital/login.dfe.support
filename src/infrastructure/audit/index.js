const config = require('./../config');

let adapter;
if (config.audit.type === 'static') {
  adapter = require('./static');
} else if (config.audit.type === 'sequelize') {
  adapter = require('./sequelize');
} else {
  throw new Error(`Invalid audit type ${config.audit.type} in config`);
}

module.exports = adapter;