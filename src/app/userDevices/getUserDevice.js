const {getUserTokenDetails} = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  const tokenDetails = await getUserTokenDetails(req, req.params);

  if(tokenDetails === null) {
    return res.status(400).send();
  }

  sendResult(req, res, 'userDevices/views/userDevice', {
    csrfToken: req.csrfToken(),
    uid: tokenDetails.uid,
    serialNumber: tokenDetails.serialNumber,
    serialNumberFormatted: tokenDetails.serialNumberFormatted,
    name: tokenDetails.name,
    orgName: tokenDetails.orgName,
    lastLogin: tokenDetails.lastLogin,
    numberOfSuccessfulLoginAttemptsInTwelveMonths: tokenDetails.numberOfSuccessfulLoginAttemptsInTwelveMonths,
    tokenStatus: tokenDetails.tokenStatus,
    audit: tokenDetails.audit.audits,
    page: tokenDetails.page,
    totalNumberOfResults: tokenDetails.totalNumberOfResults,
    numberOfPages: tokenDetails.numberOfPages,
  });
};

module.exports = action;
