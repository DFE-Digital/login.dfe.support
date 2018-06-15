const { getOrganisationById } = require('./../../infrastructure/organisations');

const getConfirmNewK2sUser = async (req, res) => {
  if (!req.session.k2sUser || !req.session.digipassSerialNumberToAssign) {
    return res.redirect('../');
  }

  const localAuthority = await getOrganisationById(req.session.k2sUser.localAuthority);

  res.render('users/views/confirmNewK2sUser', {
    csrfToken: req.csrfToken(),
    user: req.session.k2sUser,
    localAuthority,
    digipassSerialNumberToAssign: req.session.digipassSerialNumberToAssign
  });
};

module.exports = getConfirmNewK2sUser;
