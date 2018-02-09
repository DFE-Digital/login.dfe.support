const {getTokenDetails} = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  const tokenDetails = await getTokenDetails(req.params);

  sendResult(req, res, 'userDevices/views/userDevice', {
    csrfToken: req.csrfToken(),
    serialNumber: tokenDetails.serialNumber,
    serialNumberFormatted: tokenDetails.serialNumberFormatted,
    name: tokenDetails.name,
    orgName: tokenDetails.orgName,
    lastLogin: tokenDetails.lastLogin,
    numberOfSuccessfulLoginAttemptsInTwelveMonths: tokenDetails.numberOfSuccessfulLoginAttemptsInTwelveMonths,
    tokenStatus: tokenDetails.tokenStatus,
    audit: tokenDetails.audit,
  });
};

module.exports = action;
