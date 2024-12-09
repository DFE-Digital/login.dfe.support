const { sendResult } = require('../../infrastructure/utils');

const validateInput = async (req) => {
  const model = {
    email: req.body.emails || '',
    validationMessages: {},
  };

  // If no users ticked
  // Please select one or more users

  // If no actions ticked
  // Please select one or more actions
  if (!model.email) {
    model.validationMessages.email = 'Please enter an email address';
  }

  return model;
};

const postBulkUserActionsEmails = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return sendResult(req, res, 'users/views/bulkUserActionsEmails', model);
  }

  // TODO do we have a confirmation page (doing X actions to Y users) or not?
  // Get all the inputs and figure out which users were ticked
  // For each user ticked {
  // if deactivate checkbox ticked {
  // Call deactivate api endpoint (found deactivate user page)
  // }
  // if remove services and requests ticked {
  // Call services and requests endpoint (also found in deactive user page)
  // }
  // }
  // Clear out the emails in session (if we need to)
  // Flash
  // Redirect to users page

  // model.csrfToken = req.csrfToken();
  // return sendResult(req, res, 'users/views/bulkUserActionsEmails', model);
};

module.exports = postBulkUserActionsEmails;
