const { sendResult } = require('./../../infrastructure/utils');
const { getUser } = require('./../../infrastructure/directories');
const { emailPolicy } = require('login.dfe.validation');

const validateInput = async (req) => {
  const model = {
    firstName: req.body.firstName || '',
    lastName: req.body.lastName || '',
    email: req.body.email || '',
    validationMessages: {},
  };

  if (!model.firstName) {
    model.validationMessages.firstName = 'Please enter a first name';
  }

  if (!model.lastName) {
    model.validationMessages.lastName = 'Please enter a last name';
  }

  if (!model.email) {
    model.validationMessages.email = 'Please enter an email address';
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.validationMessages.email = 'Please enter a valid email address';
  } else if (await getUser(model.email, req.id)) {
    model.validationMessages.email = 'A DfE Sign-in user already exists with that email address';
  }

  return model;
};

const postNewUser = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return sendResult(req, res, 'users/views/newUser', model);
  }

  if (!req.session.newUser) {
    req.session.newUser = {};
  }
  req.session.newUser.firstName = model.firstName;
  req.session.newUser.lastName = model.lastName;
  req.session.newUser.email = model.email;

  return res.redirect('associate-organisation');
};

module.exports = postNewUser;
