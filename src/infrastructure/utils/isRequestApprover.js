const isRequestApprover = (req, res, next) => {
  if (req.user.isRequestApprover) {
    return next();
  }
  return res.status(401).render('errors/views/notAuthorised');
};

module.exports = isRequestApprover;
