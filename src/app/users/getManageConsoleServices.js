const { sendResult } = require('../../infrastructure/utils');
const { getAllServices }= require('../../infrastructure/applications')
const { getUserDetails } = require('./utils');


const getManageConsoleServices = async (req, res) => {
  const user = await getUserDetails(req);
  const services = await getAllServices();

  sendResult(req, res, 'users/views/selectManageConsoleService', {
    layout: 'sharedViews/layoutNew.ejs', 
    csrfToken: req.csrfToken(),
    backLink: `/users/${user.id}/organisations`,
    user,
    services
  });
};

module.exports =  getManageConsoleServices ;