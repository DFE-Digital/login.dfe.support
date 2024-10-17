const users = require('./app/users');
const organisations = require('./app/organisations');
const errors = require('./app/errors');
const signOut = require('./app/signOut');
const accessRequests = require('./app/accessRequests');
const healthCheck = require('login.dfe.healthcheck');
const { getHealthCheckChecks } = require('./infrastructure/healthCheck');
const config = require('./infrastructure/config');

const routes = (app, csrf) => {
  const healthCheckChecks = getHealthCheckChecks();
  app.use('/healthcheck', healthCheck({ config, checks: healthCheckChecks }));

  app.use('/users', users(csrf));
  app.use('/organisations', organisations(csrf));
  app.use('/signout', signOut(csrf));
  app.use('/access-requests', accessRequests(csrf));
  app.use('/', errors(csrf));

  app.get('/', (req, res) => {
    res.redirect('/users');
  });
  app.get('*', (req, res) => {
    res.status(404).render('errors/views/notFound');
  });
};

module.exports = routes;
