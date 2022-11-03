const { emailPolicy } = require('login.dfe.validation');
const { sendResult } = require('../../infrastructure/utils');
const { getUser } = require('../../infrastructure/directories');

const validateInput = async (req) => {
  const nameRegEx = /^[^±!@£$%^&*_+§¡€#¢§¶•ªº«\\/<>?:;|=.,~"]{1,60}$/i;
  const model = {
    firstName: req.body.firstName || '',
    lastName: req.body.lastName || '',
    email: req.body.email || '',
    validationMessages: {},
  };

  if (!model.firstName) {
    model.validationMessages.firstName = 'Please enter a first name';
  } else if (!nameRegEx.test(model.firstName)) {
    model.validationMessages.firstName = 'Special characters cannot be used';
  }

  if (!model.lastName) {
    model.validationMessages.lastName = 'Please enter a last name';
  } else if (!nameRegEx.test(model.lastName)) {
    model.validationMessages.lastName = 'Special characters cannot be used';
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

  if (!req.session.user) {
    req.session.user = {};
  }
  req.session.user.firstName = model.firstName;
  req.session.user.lastName = model.lastName;
  req.session.user.email = model.email;
  const redirectLink = (req.query.review && req.query.review === 'true') ? 'confirm-new-user' : 'associate-organisation';
  return res.redirect(redirectLink);
};

module.exports = postNewUser;
