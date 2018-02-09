const { sendResult } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');
const { getAllOrganisations, getServiceIdentifierDetails } = require('./../../infrastructure/organisations');
const { getUser } = require('./../../infrastructure/directories');
const { emailPolicy } = require('login.dfe.validation');

const keyToSuccessIdentifierAlreadyUsed = async (k2sId, correlationId) => {
  const identifier = await getServiceIdentifierDetails(config.serviceMapping.key2SuccessServiceId, 'k2s-id', k2sId, correlationId);
  return identifier ? true : false;
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
    model.validationMessages.firstName = 'First name is required';
  }

  if (!model.lastName) {
    model.isValid = false;
    model.validationMessages.lastName = 'Last name is required';
  }

  if (!model.email) {
    model.isValid = false;
    model.validationMessages.email = 'Email address is required';
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.isValid = false;
    model.validationMessages.email = 'Email address must be in a valid format';
  } else if (await getUser(model.email, req.id)) {
    model.isValid = false;
    model.validationMessages.email = 'User already exists with this email address';
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
    model.validationMessages.k2sId = 'Key to Success ID is required';
  } else if (model.k2sId.length !== 7 || isNaN(parseInt(model.k2sId))) {
    model.isValid = false;
    model.validationMessages.k2sId = 'Key to Success ID should be 7 numbers';
  } else if (await keyToSuccessIdentifierAlreadyUsed(model.k2sId, req.id)) {
    model.isValid = false;
    model.validationMessages.k2sId = 'User already exists with this Key to Success ID';
  }

  return model;
};

const postNewUserK2S = async (req, res) => {
  const orgs = await getAllOrganisations();
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
