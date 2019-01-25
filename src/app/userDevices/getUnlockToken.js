
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  sendResult(req, res, 'userDevices/views/unlockToken', {
    csrfToken: req.csrfToken(),
    uid: req.params.uid,
    serialNumber: req.params.serialNumber,
    validationMessages: {},
    backLink: '/userdevices/' + req.params.serialNumber,
  });
};

module.exports = action;
