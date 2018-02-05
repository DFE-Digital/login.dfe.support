const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { updateUser } = require('./../../infrastructure/directories');

const validate = (req) => {
  const validationMessages = {};
  let isValid = true;

  if (!req.body.firstName) {
    validationMessages.firstName = 'Must specify a first name';
    isValid = false;
  }

  if (!req.body.lastName) {
    validationMessages.lastName = 'Must specify a last name';
    isValid = false;
  }

  return {
    isValid,
    validationMessages,
  };
};

const postEditProfile = async (req, res) => {
  const validationResult = validate(req);
  if (!validationResult.isValid) {
    const user = await getUserDetails(req);
    sendResult(req, res, 'users/views/editProfile', {
      csrfToken: req.csrfToken(),
      user,
      validationMessages: validationResult.validationMessages,
    });
    return;
  }

  const uid = req.params.uid;
  await updateUser(uid, req.body.firstName, req.body.lastName, req.id);
  return res.redirect('services');
};

module.exports = postEditProfile;
