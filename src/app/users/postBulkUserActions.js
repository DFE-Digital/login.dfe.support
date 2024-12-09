//const { emailPolicy } = require('login.dfe.validation');
const { sendResult } = require('../../infrastructure/utils');
const { search } = require('./utils');

const validateInput = async (req) => {
  const model = {
    email: req.body.emails || '',
    validationMessages: {},
  };

  if (!model.email) {
    model.validationMessages.email = 'Please enter an email address';
  }
  // Split it by comma
  // For (email in emails) {
  // } if (!emailPolicy.doesEmailMeetPolicy(email)) {
  //   model.validationMessages.email = `Please enter a valid email address for ${email}`;
  // }
  // }

  return model;
};

const postBulkUserActions = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return sendResult(req, res, 'users/views/bulkUserActions', model);
  }

  // const result = await search(req);
  // console.log(model);
  // model.csrfToken = req.csrfToken();
  // return sendResult(req, res, 'users/views/bulkUserActions', model);

  console.log(req.body.emails);
  req.session.emails = req.body.emails;
  return res.redirect('bulk-user-actions/emails');
};

module.exports = postBulkUserActions;
