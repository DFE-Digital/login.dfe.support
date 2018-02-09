const { getAllOrganisations } = require('./../../infrastructure/organisations');

const getNewUserK2S = async (req, res) => {
  const orgs = await getAllOrganisations();

  res.render('users/views/newUserK2S', {
    csrfToken: req.csrfToken(),
    firstName: '',
    lastName: '',
    email: '',
    localAuthority: null,
    k2sId: '',
    localAuthorities: orgs,
    validationMessages: {},
  });
};

module.exports = getNewUserK2S;
