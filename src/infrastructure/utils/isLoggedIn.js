const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.isLoggedIn = true;
    return next();
  }
  req.session.redirectUrl = req.originalUrl;
  return res.status(302).redirect('/auth');
};

module.exports = isLoggedIn;
