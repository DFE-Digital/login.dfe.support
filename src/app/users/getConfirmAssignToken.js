const getAssignDigipass = (req, res) => {

  return res.render('users/views/confirmDigipass', {
    csrfToken: req.csrfToken(),
    userId: req.params.uid,
    email: req.session.user.email,
    user: req.session.user,
    serialNumber: req.session.digipassSerialNumberToAssign,
    validationMessages: {},
  })
};

module.exports = getAssignDigipass;
