const getAssignDigipass = (req, res) => {

  return res.render('users/views/confirmDigipass', {
    csrfToken: req.csrfToken(),
    userId: req.params.uid,
    serialNumber: req.params.serialNumber,
    validationMessages: {},
  })
};

module.exports = getAssignDigipass;
