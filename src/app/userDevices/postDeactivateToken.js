const { deactivateToken } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  const result = await deactivateToken(req);

  sendResult(req, res, 'userDevices/views/deactivateToken', {
    csrfToken: req.csrfToken(),
    uid: req.params.uid,
    serialNumber: req.params.serialNumber,
    validationMessages: {},
  });
};

module.exports = action;
