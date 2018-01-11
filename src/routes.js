const users = require('./app/users');

const routes = (app, csrf) => {
  app.use('/users', users(csrf));

  app.get('/', (req, res) => {
    res.redirect('/users');
  })
};

module.exports = routes;
