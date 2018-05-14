const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');

const getEditProfile = async (req, res) => {
  const user = await getUserDetails(req);

  sendResult(req, res, 'users/views/editProfile', {
    csrfToken: req.csrfToken(),
    user,
    backLink: 'services',
    validationMessages: {},
  });
};

module.exports = getEditProfile;
