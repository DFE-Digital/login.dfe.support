const { sendResult } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');
const { searchOrganisations } = require('./../../infrastructure/organisations');
const { getServiceIdentifierDetails } = require('./../../infrastructure/access');
const { getUser } = require('./../../infrastructure/directories');
const { emailPolicy } = require('login.dfe.validation');

const keyToSuccessIdentifierAlreadyUsed = async (k2sId, correlationId) => {
  const identifier = await getServiceIdentifierDetails(config.serviceMapping.key2SuccessServiceId, 'k2s-id', k2sId, correlationId);
  return identifier.services.length !== 0;
};

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

const validateInput = async (req, orgs) => {
  const model = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    localAuthority: req.body.localAuthority,
    k2sId: req.body.k2sId,
    isValid: true,
    validationMessages: {},
  };

  if (!model.firstName) {
    model.isValid = false;
    model.validationMessages.firstName = 'Please enter a first name';
  }

  if (!model.lastName) {
    model.isValid = false;
    model.validationMessages.lastName = 'Please enter a last name';
  }

  if (!model.email) {
    model.isValid = false;
    model.validationMessages.email = 'Please enter an email address';
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.isValid = false;
    model.validationMessages.email = 'Please enter a valid email address';
  } else if (await getUser(model.email, req.id)) {
    model.isValid = false;
    model.validationMessages.email = 'A DfE Sign-in user already exists with that email address';
  }

  if (!model.localAuthority) {
    model.isValid = false;
    model.validationMessages.localAuthority = 'Local authority is required';
  } else if (!orgs.find(o => o.id === model.localAuthority)) {
    model.isValid = false;
    model.validationMessages.localAuthority = 'Invalid local authority value';
  }

  if (!model.k2sId) {
    model.isValid = false;
    model.validationMessages.k2sId = 'Please enter a Key to Success ID';
  } else if (model.k2sId.length !== 7 || isNaN(model.k2sId)) {
    model.isValid = false;
    model.validationMessages.k2sId = 'Please enter a valid Key to Success ID';
  } else if (await keyToSuccessIdentifierAlreadyUsed(model.k2sId, req.id)) {
    model.isValid = false;
    model.validationMessages.k2sId = 'A DfE Sign-in user already exists with that Key to Success ID';
  }

  return model;
};

const postNewUserK2S = async (req, res) => {
  const orgs = await getLocalAutorities(req.id);
  const validationResult = await validateInput(req, orgs);
  if (!validationResult.isValid) {
    validationResult.csrfToken = req.csrfToken();
    validationResult.localAuthorities = orgs;
    return sendResult(req, res, 'users/views/newUserK2S', validationResult);
  }

  req.session.k2sUser = {
    firstName: validationResult.firstName,
    lastName: validationResult.lastName,
    email: validationResult.email,
    localAuthority: validationResult.localAuthority,
    k2sId: validationResult.k2sId,
  };
  return res.redirect('assign-digipass');
};

module.exports = postNewUserK2S;
