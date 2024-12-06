const { emailPolicy } = require('login.dfe.validation');
const { sendResult } = require('../../infrastructure/utils');
const { search } = require('./utils');

const validateInput = async (req) => {
  const model = {
    email: req.body.emails || '',
    validationMessages: {},
  };

  if (!model.email) {
    model.validationMessages.email = 'Please enter an email address';
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.validationMessages.email = 'Please enter a valid email address';
  }

  return model;
};

const postBulkUserActions = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return sendResult(req, res, 'users/views/bulkUserActions', model);
  }

  const result = await search(req);
  console.log(result);

  if (!req.session.user) {
    req.session.user = {};
  }
  req.session.user.firstName = model.firstName;
  req.session.user.lastName = model.lastName;
  req.session.user.email = model.email;
  const redirectLink = (req.query.review && req.query.review === 'true') ? 'confirm-new-user' : 'associate-organisation';
  return res.redirect(redirectLink);
};

module.exports = postBulkUserActions;
