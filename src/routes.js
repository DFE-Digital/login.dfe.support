const users = require('./app/users');
const userDevices = require('./app/userDevices');
const errors = require('./app/errors');
const healthCheck = require('login.dfe.healthcheck');
const { getHealthCheckChecks } = require('./infrastructure/healthCheck');
const config = require('./infrastructure/config');

const routes = (app, csrf) => {
  const healthCheckChecks = getHealthCheckChecks();
  app.use('/healthcheck', healthCheck({ config, checks: healthCheckChecks }));

  app.use('/users', users(csrf));
  app.use('/userDevices', userDevices(csrf));
  app.use('/', errors(csrf));

  app.get('/', (req, res) => {
    res.redirect('/users');
  });
};

module.exports = routes;
