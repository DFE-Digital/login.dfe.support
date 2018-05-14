const { sendResult } = require('./../../infrastructure/utils');

const getConfirmDeactivate = (req, res) => {
  sendResult(req, res, 'users/views/confirmDeactivate', {
    csrfToken: req.csrfToken(),
    backLink: 'services',
    reason: '',
    validationMessages: {},
  });
};

module.exports = getConfirmDeactivate;