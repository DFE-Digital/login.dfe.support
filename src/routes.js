const users = require('./app/users');
const errors = require('./app/errors');

const routes = (app, csrf) => {
  app.use('/users', users(csrf));
  app.use('/', errors(csrf));

  app.get('/', (req, res) => {
    res.redirect('/users');
  });
};

module.exports = routes;
