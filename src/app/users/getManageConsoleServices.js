const { sendResult } = require('../../infrastructure/utils');
const { getAllServices } = require('../../infrastructure/applications');
const { dateFormat } = require('../helpers/dateFormatterHelper');
const { getUserDetails } = require('./utils');

const getManageConsoleServices = async (req, res) => {
  const user = await getUserDetails(req);
  user.formattedLastLogin = user.lastLogin ? dateFormat(user.lastLogin, 'longDateFormat') : '';
  const allServices = await getAllServices();

  sendResult(req, res, 'users/views/selectManageConsoleService', {
    csrfToken: req.csrfToken(),
    backLink: `/users/${user.id}/organisations`,
    user,
    allServices
  });
};

module.exports = getManageConsoleServices;