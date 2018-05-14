const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');

const getEditEmail = async (req, res) => {
  const user = await getUserDetails(req);

  sendResult(req, res, 'users/views/editEmail', {
    csrfToken: req.csrfToken(),
    user,
    backLink: 'services',
    email: user.email,
    validationMessages: {},
  });
};

module.exports = getEditEmail;
