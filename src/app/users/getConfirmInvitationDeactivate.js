const { sendResult } = require('./../../infrastructure/utils');

const getConfirmDeactivate = (req, res) => {
  sendResult(req, res, 'users/views/confirmInvitationDeactivate', {
    csrfToken: req.csrfToken(),
    reason: '',
    validationMessages: {},
  });
};

module.exports = getConfirmDeactivate;