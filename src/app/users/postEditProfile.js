const logger = require('./../../infrastructure/logger');
const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { updateUser } = require('./../../infrastructure/directories');
const { getById, updateIndex } = require('./../../infrastructure/users');

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

const updateUserIndex = async (uid, firstName, lastName) => {
  const user = await getById(uid);
  user.name = `${firstName} ${lastName}`;
  if (user.lastLogin) {
    user.lastLogin = user.lastLogin.getTime();
  }
  await updateIndex([user]);
};

const auditEdit = (req, user) => {
  const editedFields = [];

  if (req.body.firstName !== user.firstName) {
    editedFields.push({
      name: 'given_name',
      oldValue: user.firstName,
      newValue: req.body.firstName,
    });
  }

  if (req.body.lastName !== user.lastName) {
    editedFields.push({
      name: 'family_name',
      oldValue: user.lastName,
      newValue: req.body.lastName,
    });
  }

  logger.audit(`${req.user.email} (id: ${req.user.sub}) updated user ${user.email} (id: ${user.id})`, {
    type: 'support',
    subType: 'user-edit',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: user.id,
    editedFields,
  });
};

const postEditProfile = async (req, res) => {
  const user = await getUserDetails(req);
  const validationResult = validate(req);
  if (!validationResult.isValid) {
    sendResult(req, res, 'users/views/editProfile', {
      csrfToken: req.csrfToken(),
      user,
      validationMessages: validationResult.validationMessages,
    });
    return;
  }

  const uid = req.params.uid;
  await updateUser(uid, req.body.firstName, req.body.lastName, req.id);
  await updateUserIndex(uid, req.body.firstName, req.body.lastName);

  auditEdit(req, user);

  return res.redirect('services');
};

module.exports = postEditProfile;
