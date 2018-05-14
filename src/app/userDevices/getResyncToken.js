const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {
  sendResult(req, res, 'userDevices/views/resyncToken', {
    csrfToken: req.csrfToken(),
    id: '',
    code1: '',
    code2: '',
    backLink: '/userdevices/' + req.params.serialNumber + '/' + req.params.uid,
    validationMessages: [],
    uid: req.params.uid,
    serialNumber: req.params.serialNumber,
  });
};

module.exports = action;
