/* eslint-disable no-restricted-syntax */
const { emailPolicy } = require('login.dfe.validation');
const { sendResult } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

const validateInput = async (req) => {
  const model = {
    layout: 'sharedViews/layoutNew.ejs',
    backLink: '../bulk-user-actions',
    currentPage: 'users',
    emails: req.body.emails || '',
    validationMessages: {},
  };

  if (!model.emails) {
    model.validationMessages.emails = 'Please enter an email address';
    return model;
  }

  // Remove trailing comma (if present)
  model.emails = model.emails.replace(/,$/, '');
  // Removes any newline characters
  model.emails = model.emails.replace('&#13;', '');
  model.emails = model.emails.replace('&#10;', '');

  // Trim whitespace around each email provided and remove duplicates
  const trimmedEmails = model.emails.split(',').map((email) => email.trim());
  const deduplicatedEmails = [...new Set(trimmedEmails)];

  if (deduplicatedEmails.length > 100) {
    model.validationMessages.emails = 'A maximum of 100 emails can be provided';
  } else {
    for (const email of deduplicatedEmails) {
      if (!emailPolicy.doesEmailMeetPolicy(email)) {
        model.validationMessages.emails = `Please enter a valid email address for ${email}`;
      }
    }
  }

  // Reglue array together back into a comma separated string
  model.emails = deduplicatedEmails.join();

  return model;
};

const postBulkUserActions = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return sendResult(req, res, 'users/views/bulkUserActions', model);
  }

  req.session.emails = model.emails;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error('An error occurred when saving to the session', error);
      model.validationMessages.emails = 'Something went wrong submitting data, please try again';
      model.csrfToken = req.csrfToken();
      return sendResult(req, res, 'users/views/bulkUserActions', model);
    }
    return res.redirect('bulk-user-actions/emails');
  });
};

module.exports = postBulkUserActions;
