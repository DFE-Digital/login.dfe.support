const logger = require('./../../infrastructure/logger');
const { getUserDetails } = require('./utils');
const { deactivate } = require('./../../infrastructure/directories');
const { getById, updateIndex } = require('./../../infrastructure/users');

const updateUserIndex = async (uid) => {
  const user = await getById(uid);
  user.status = {
    id: 0,
    description: 'Deactivated',
  };
  if (user.lastLogin) {
    user.lastLogin = user.lastLogin.getTime();
  }
  await updateIndex([user]);
};

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);

  await deactivate(user.id, req.id);
  await updateUserIndex(user.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) deactivated user ${user.email} (id: ${user.id})`, {
    type: 'support',
    subType: 'user-edit',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: user.id,
    editedFields: [
      {
        name: 'status',
        oldValue: user.status.id,
        newValue: 0,
      }
    ],
    reason: req.body.reason,
  });

  return res.redirect('services');
};

module.exports = postConfirmDeactivate;