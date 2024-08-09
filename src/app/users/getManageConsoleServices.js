const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getServicesByUserId } = require('./../../infrastructure/access');

const getManageConsoleServices = async (req, res) => {
  const user = await getUserDetails(req);
  const services = await getServicesByUserId(user.id);

  sendResult(req, res, 'users/views/selectManageConsoleService', {
    csrfToken: req.csrfToken(),
    backLink: `/users/${user.id}/organisations`,
    user,
    services
  });
};

module.exports =  getManageConsoleServices ;