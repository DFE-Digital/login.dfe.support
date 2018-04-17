const logger = require('./../../infrastructure/logger');
const { deleteChangeEmailCode } = require('./../../infrastructure/directories');
const { getById, updateIndex } = require('./../../infrastructure/users');
const { getUserDetails, waitForIndexToUpdate } = require('./utils');

const updateUserIndex = async (uid) => {
  const user = await getById(uid);
  user.pendingEmail = undefined;
  await updateIndex([user]);

  await waitForIndexToUpdate(uid, (updated) => !updated.pendingEmail);
};

const postCancelChangeEmail = async (req, res) => {
  const user = await getUserDetails(req);

  await deleteChangeEmailCode(req.params.uid);
  await updateUserIndex(req.params.uid);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) cancelled the change of email for ${user.email} (id: ${user.id}) to email ${user.pendingEmail}`, {
    type: 'support',
    subType: 'user-editemail',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: user.id,
    editedFields: [{
      name: 'new_email',
      oldValue: user.pendingEmail,
      newValue: '',
    }],
  });

  return res.redirect('services');
};

module.exports = postCancelChangeEmail;
