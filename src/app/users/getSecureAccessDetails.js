const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getLegacyUsernames } = require('./../../infrastructure/directories');

const getSecureDetails = async (req, res) => {
  const user = await getUserDetails(req);
  const secureAccessDetails = await getLegacyUsernames(req.params.uid, req.id);
  sendResult(req, res, 'users/views/secureAccessDetails', {
    csrfToken: req.csrfToken(),
    user,
    secureAccessDetails,
    isInvitation: req.params.uid.startsWith('inv-'),
  });
};

module.exports = getSecureDetails;
