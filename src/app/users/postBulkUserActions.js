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

  const emailsArray = model.emails.split(',');
  // eslint-disable-next-line no-restricted-syntax
  for (const email of emailsArray) {
    if (!emailPolicy.doesEmailMeetPolicy(email)) {
      // TODO currently only reports on 1 error at a time.  Is this acceptable or should we report on many?
      model.validationMessages.email = `Please enter a valid email address for ${email}`;
    }
  }

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
