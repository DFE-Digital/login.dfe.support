const isServiceCreator = (req, res, next) => {
  if (req.user.isServiceCreator) {
    res.locals.isServiceCreator = true;
  }
  return next();
};

module.exports = isServiceCreator;
