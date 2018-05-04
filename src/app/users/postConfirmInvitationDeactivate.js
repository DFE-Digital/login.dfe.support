const logger = require('./../../infrastructure/logger');
const { getUserDetails, waitForIndexToUpdate } = require('./utils');
const { deactivateInvite } = require('./../../infrastructure/directories');
const { getById, updateIndex } = require('./../../infrastructure/users');

const updateUserIndex = async (uid) => {
  const user = await getById(uid);
  user.status.id = -2;
  user.status.description = 'Deactivated Invitation';
  if (user.lastLogin) {
    user.lastLogin = user.lastLogin.getTime();
  }
  await updateIndex([user]);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === -2);
};

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);

  await deactivateInvite(user.id, req.body.reason, req.id);
  await updateUserIndex(user.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) deactivated user invitation ${user.email} (id: ${user.id})`, {
    type: 'support',
    subType: 'user-edit',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: user.id,
    editedFields: [
      {
        name: 'status',
        oldValue: user.status.id,
        newValue: -2,
      }
    ],
    reason: req.body.reason,
  });

  return res.redirect('services');
};

module.exports = postConfirmDeactivate;