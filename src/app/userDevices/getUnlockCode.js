
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  const tokenDetails = await getUserTokenDetails(req, req.params);

  sendResult(req, res, 'userDevices/views/getUnlockCode', {
    csrfToken: req.csrfToken(),
    uid: req.params.uid,
    serialNumber: req.params.serialNumber,
  });
};

module.exports = action;
