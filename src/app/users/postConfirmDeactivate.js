const logger = require('./../../infrastructure/logger');
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require('./utils');
const { deactivate } = require('./../../infrastructure/directories');

const updateUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status = {
    id: 0,
    description: 'Deactivated',
  };

  await updateUserDetails(user, correlationId);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === 0);
};

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);

  await deactivate(user.id, req.id);
  await updateUserIndex(user.id, req.id);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) deactivated user ${
      user.email
    } (id: ${user.id}) (legacyId: ${
      user.legacyId ? JSON.stringify(user.legacyId) : 'null'
    })`,
    {
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
        },
      ],
      reason: req.body.reason,
    }
  );

  return res.redirect('services');
};

module.exports = postConfirmDeactivate;
