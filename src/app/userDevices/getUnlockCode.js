
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  const tokenDetails = await getUserTokenDetails(req, req.params);

  sendResult(req, res, 'userDevices/views/getUnlockCode', {
    csrfToken: req.csrfToken(),
    uid: tokenDetails.uid,
    serialNumber: tokenDetails.serialNumber,
  });
};

module.exports = action;
