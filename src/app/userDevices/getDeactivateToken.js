
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  sendResult(req, res, 'userDevices/views/deactivateToken', {
    csrfToken: req.csrfToken(),
    uid: req.params.uid,
    serialNumber: req.params.serialNumber,
    validationMessages: {},
  });
};

module.exports = action;
