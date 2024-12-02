const logger = require('../../infrastructure/logger');
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require('./utils');
const { reactivateInvite } = require('../../infrastructure/directories');

const updateUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status.id = 1;
  user.status.description = 'Reactivated Invitation';

  await updateUserDetails(user, correlationId);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === 1);
};

const postConfirmReactivate = async (req, res) => {
  const user = await getUserDetails(req);

  await reactivateInvite(user.id, req.body.reason, req.id);
  await updateUserIndex(user.id, req.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) reactivated user invitation ${user.email} (id: ${user.id})`, {
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
    reason: req.body.reason,
  });

  res.flash('info', 'The invitation has been reactivated');  
  res.redirect('services');
};

module.exports = postConfirmReactivate;