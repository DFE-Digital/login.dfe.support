
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  sendResult(req, res, 'userDevices/views/userDevice', {
    csrfToken: req.csrfToken(),
    serialNumber: '123-test',
    name: 'Mr Test Test',
    orgName: "My Org",
    lastLogin: '15:32:42  05/11/2017',
    loginsInTwelveMonths: '10',
    tokenStatus: 'Active',
    audit: [{
      date: '15:32:42  05/11/2017',
      event:'Login',
      result:'Success',
      user: 'Barry',
    }],
  });
};

module.exports = action;
