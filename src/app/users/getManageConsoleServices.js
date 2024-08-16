const { sendResult } = require('../../infrastructure/utils');
const { getAllServices } = require('../../infrastructure/applications')
const { getUserDetails } = require('./utils');
const { getServicesByUserId } = require('./../../infrastructure/access');

const getManageConsoleServices = async (req, res) => {
  const user = await getUserDetails(req);
  const allServices = await getAllServices();
  const userServices = await getServicesByUserId(user.id);

  let services = [];
  if (userServices != undefined) {
    const filterIds = new Set(userServices.map(item => item.serviceId));
    services = allServices.services.filter(item => filterIds.has(item.id));
  };

  sendResult(req, res, 'users/views/selectManageConsoleService', {
    csrfToken: req.csrfToken(),
    backLink: `/users/${user.id}/organisations`,
    user,
    services
  });
};

module.exports = getManageConsoleServices;