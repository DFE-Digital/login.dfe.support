const logger = require('./../../infrastructure/logger');
const { getUserDetails, waitForIndexToUpdate } = require('./utils');
const { reactivate } = require('./../../infrastructure/directories');
const { getById, updateIndex } = require('./../../infrastructure/users');

const updateUserIndex = async (uid) => {
  const user = await getById(uid);
  user.status = {
    id: 1,
    description: 'Active',
  };
  if (user.lastLogin) {
    user.lastLogin = user.lastLogin.getTime();
  }
  await updateIndex([user]);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === 1);
};

const postConfirmReactivate = async (req, res) => {
  const user = await getUserDetails(req);

  await reactivate(req.params.uid, req.id);
  await updateUserIndex(req.params.uid);

  // Audit
  logger.audit(`${req.user.email} (id: ${req.user.sub}) reactivated user ${user.email} (id: ${user.id})`, {
    type: 'support',
    subType: 'user-edit',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: user.id,
    editedFields: [
      {
        name: 'status',
        oldValue: user.status.id,
        newValue: 1,
      }
    ],
  });

  res.flash('info', 'The account has been reactivated');
  res.redirect('services');
};

module.exports = postConfirmReactivate;
