const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {
  sendResult(req, res, 'userDevices/views/search', {
    csrfToken: req.csrfToken(),
    criteria: undefined,
    validationMessages: {},
  });
};

module.exports = action;
