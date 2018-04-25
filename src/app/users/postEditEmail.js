const logger = require('./../../infrastructure/logger');
const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUser, createChangeEmailCode } = require('./../../infrastructure/directories');
const { emailPolicy } = require('login.dfe.validation');

const validate = async (req) => {
  const model = {
    email: req.body.email || '',
    validationMessages: {},
  };

  if (!model.email || model.email.trim().length === 0) {
    model.validationMessages.email = 'Please enter email address';
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.validationMessages.email = 'Please enter a valid email address';
  } else if (await getUser(model.email, req.id)) {
    model.validationMessages.email = 'A DfE Sign-in user already exists with that email address';
  }

  return model;
};

const postEditEmail = async (req, res) => {
  const user = await getUserDetails(req);

  const model = await validate(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.user = user;
    sendResult(req, res, 'users/views/editEmail', model);
  }

  await createChangeEmailCode(user.id, model.email, 'support', 'na', req.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) initiated a change of email for ${user.email} (id: ${user.id}) to ${model.email}`, {
    type: 'support',
    subType: 'user-editemail',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: user.id,
    editedFields: [{
      name: 'new_email',
      oldValue: user.email,
      newValue: model.email,
    }],
  });

  return res.redirect('services');
};

module.exports = postEditEmail;
