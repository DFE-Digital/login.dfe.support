const { sendResult } = require('../../infrastructure/utils');
const { getAllServices } = require('../../infrastructure/applications')
const { getUserDetails } = require('./utils');

const getManageConsoleServices = async (req, res) => {
  const user = await getUserDetails(req);
  const allServices = await getAllServices();

  sendResult(req, res, 'users/views/selectManageConsoleService', {
    csrfToken: req.csrfToken(),
    backLink: `/users/${user.id}/organisations`,
    user,
    allServices
  });
};

module.exports = getManageConsoleServices;