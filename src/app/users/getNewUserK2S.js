const { searchOrganisations } = require('./../../infrastructure/organisations');

const getLocalAutorities = async (correlationId) => {
  let pageNumber = 1;
  let hasMorePages = true;
  const localAuthorities = [];
  while (hasMorePages) {
    const page = await searchOrganisations('', ['002'], pageNumber, correlationId);

    if (page.organisations.length > 0) {
      localAuthorities.push(...page.organisations);
    }

    pageNumber++;
    hasMorePages = page.page < page.totalNumberOfPages;
  }
  return localAuthorities;
};

const getNewUserK2S = async (req, res) => {
  const orgs = await getLocalAutorities(req.id);
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
