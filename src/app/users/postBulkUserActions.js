/* eslint-disable no-restricted-syntax */
const { emailPolicy } = require('login.dfe.validation');
const { sendResult } = require('../../infrastructure/utils');

const validateInput = async (req) => {
  const model = {
    emails: req.body.emails || '',
    validationMessages: {},
  };

  if (!model.emails) {
    model.validationMessages.email = 'Please enter an email address';
    return model;
  }

  // Removes any newline characters
  model.emails = model.emails.replace('&#13;', '');
  model.emails = model.emails.replace('&#10;', '');

  // Trim whitespace around each email provided
  const trimmedEmails = model.emails.split(',').map((email) => email.trim());

  for (const email of trimmedEmails) {
    if (!emailPolicy.doesEmailMeetPolicy(email)) {
      model.validationMessages.email = `Please enter a valid email address for ${email}`;
    }
  }

  // Reglue array together back into a comma separated string
  model.emails = trimmedEmails.join();

  return model;
};

const postBulkUserActions = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return sendResult(req, res, 'users/views/bulkUserActions', model);
  }

  req.session.emails = model.emails;
  return res.redirect('bulk-user-actions/emails');
};

module.exports = postBulkUserActions;
