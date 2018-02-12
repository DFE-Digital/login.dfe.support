const getConfirmNewK2sUser = async (req, res) => {
  if (!req.session.k2sUser || !req.session.digipassSerialNumberToAssign) {
    return res.redirect('../');
  }
  res.render('users/views/confirmNewK2sUser', {
    csrfToken: req.csrfToken(),
    user: req.session.k2sUser,
    digipassSerialNumberToAssign: req.session.digipassSerialNumberToAssign
  });
};

module.exports = getConfirmNewK2sUser;
