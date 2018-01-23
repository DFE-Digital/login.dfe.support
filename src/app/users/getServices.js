const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');

const action = async (req, res) => {
  const user = await getUserDetails(req);

  sendResult(req, res, 'users/views/services', {
    csrfToken: req.csrfToken(),
    user,
  });
};

module.exports = action;