const logger = require('./../../infrastructure/logger');
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require('./utils');
const { deactivate } = require('./../../infrastructure/directories');
const { sendResult } = require('./../../infrastructure/utils');


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
  
  if (req.body['select-reason'] && req.body.reason.trim() === '') {
    req.body.reason = req.body['select-reason'];
  };

  if (req.body.reason.match(/^\s*$/) !== null) {
    sendResult(req, res, 'users/views/confirmDeactivate', {
      csrfToken: req.csrfToken(),
      backLink: 'services',
      reason: '',
      validationMessages: {
        reason: 'Please give a reason for deactivation'
      },
    });
  } else {
    await deactivate(user.id, req.id);
    await updateUserIndex(user.id, req.id);

    logger.audit(
      `${req.user.email} (id: ${req.user.sub}) deactivated user ${
        user.email
      } (id: ${user.id})`,
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
  }
};

module.exports = postConfirmDeactivate;
