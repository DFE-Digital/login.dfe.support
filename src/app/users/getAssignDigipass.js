const getAssignDigipass = (req, res) => {
  if (!req.session.k2sUser) {
    return res.redirect('../');
  }
  return res.render('users/views/assignDigipass', {
    csrfToken: req.csrfToken(),
    user: req.session.k2sUser,
    serialNumber: '',
    validationMessages: {},
  })
};

module.exports = getAssignDigipass;
