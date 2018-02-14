const { getAllOrganisations } = require('./../../infrastructure/organisations');

const getNewUserK2S = async (req, res) => {
  const orgs = await getAllOrganisations();
  let model = {
    csrfToken: req.csrfToken(),
    firstName: '',
    lastName: '',
    email: '',
    localAuthority: null,
    k2sId: '',
    localAuthorities: orgs,
    validationMessages: {},
  };
  if (req.session.k2sUser) {
    model = Object.assign(model, req.session.k2sUser);
  }

  res.render('users/views/newUserK2S', model);
};

module.exports = getNewUserK2S;
