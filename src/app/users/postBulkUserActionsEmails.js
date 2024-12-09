const { sendResult } = require('../../infrastructure/utils');

const validateInput = async (req) => {
  const model = {
    users: [],
    validationMessages: {},
  };
  console.log(req.body);

  // If no users ticked
  // Please select one or more users

  // If no actions ticked
  // Please select one or more actions
  const reqBody = req.body;
  const isDeactivateTicked = reqBody['deactivate-users'] || false;
  const isRemoveServicesAndRequestsTicked = reqBody['remove-services-and-requests'] || false;
  if (!isDeactivateTicked && !isRemoveServicesAndRequestsTicked) {
    model.validationMessages.email = 'An action needs to be ticked';
  }

  return model;
};

const postBulkUserActionsEmails = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.users = [{
      id: 'abc-123',
      name: 'Timmy Tester',
      email: 'timmy@tester.test',
      organisation: {
        name: 'Testco',
      },
      lastLogin: new Date(2018, 0, 11, 11, 30, 57),
      status: {
        description: 'Active',
      },
    }];
    return sendResult(req, res, 'users/views/bulkUserActionsEmails', model);
  }

  const reqBody = req.body;
  const isDeactivateTicked = reqBody['deactivate-users'] || false;
  const isRemoveServicesAndRequestsTicked = reqBody['remove-services-and-requests'] || false;

  // TODO do we have a confirmation page (doing X actions to Y users) or not?
  // Get all the inputs and figure out which users were ticked
  const tickedUsers = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const user of tickedUsers) {
    if (isDeactivateTicked) {
      console.log(`Call the deactivate api for ${user}`);
    }

    if (isRemoveServicesAndRequestsTicked) {
      console.log(`Call the remove services and requests api for ${user}`);
    }
  }
  // Clear out the emails in session (if we need to)
  // Flash

  // model.csrfToken = req.csrfToken();
  return res.redirect('/users');
};

module.exports = postBulkUserActionsEmails;
