const logger = require('./../../infrastructure/logger');
const { getUserDetails } = require('./utils');
const { deactivate } = require('./../../infrastructure/directories');

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);

  await deactivate(user.id, req.id);

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