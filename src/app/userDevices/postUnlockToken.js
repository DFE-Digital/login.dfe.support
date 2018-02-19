const { unlockToken } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  const unlockTokenResult = await unlockToken(req);

  if(unlockTokenResult.success) {
    sendResult(req, res, 'userDevices/views/unlockTokenCode', {
      csrfToken: req.csrfToken(),
      unlockCode: unlockTokenResult.code,
      uid: req.body.uid,
      serialNumber: req.body.serialNumber,
    });
  }
  else {
    sendResult(req, res, 'userDevices/views/unlockToken', {
      csrfToken: req.csrfToken(),
      code1: '',
      code2: '',
      validationMessages: unlockTokenResult.validationResult.messages,
      uid: req.body.uid,
      serialNumber: req.body.serialNumber,
    });
  }

};

module.exports = action;
