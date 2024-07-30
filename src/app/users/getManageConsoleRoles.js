const config = require('../../infrastructure/config');
const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails} = require('./utils');
const { getServiceById } = require('../../infrastructure/applications')
const { listRolesOfService, getSingleUserService, getSingleInvitationService, updateUserService } = require('../../infrastructure/access');

const getSingleServiceForUser = async (userId, organisationId, serviceId, correlationId) => {
  console.log(' INSIDE getSingleServiceForUser:: ', userId, organisationId, serviceId, correlationId)
  const userService = userId.startsWith('inv-') ? await getSingleInvitationService(userId.substr(4), serviceId, organisationId, correlationId) : await getSingleUserService(userId, serviceId, organisationId, correlationId);
  const application = await getServiceById(serviceId, correlationId);

  return {
    id: userService.serviceId,
    roles: userService.roles,
    name: application.name
  }
};

const addOrChangeManageConsoleServiceTitle = (userManageRoles, manageConsoleRoleIds) => {
  let userManageConsoleRoleIds = [];
  let result = false;
  for(let i=0; i < userManageRoles.roles.length; i++) {
    userManageConsoleRoleIds.push(userManageRoles.roles[i].id);
  }

  for(let i=0; i < manageConsoleRoleIds.length; i++) {
   if (userManageConsoleRoleIds.includes(manageConsoleRoleIds[i])) {
    result = true;
    break;
  }
}
return result;
}

const checkIfRolesChanged = (rolesSelectedBeforeSession, newRolesSelected) => {
  return !(JSON.stringify(rolesSelectedBeforeSession.sort()) === JSON.stringify(newRolesSelected.sort()));
}

const getManageConsoleRoles = async (req, res) => {
  
  const manage = await getServiceById('manage');
  const serviceSelectedByUser = await getServiceById(req.params.sid);
  const user = await getUserDetails(req);
  const userManageRoles = await getSingleServiceForUser(req.params.uid, config.access.identifiers.departmentForEducation, manage.id, req.id);
  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id);
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid);
    
  let manageConsoleRoleIds = [];
  manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id));
  const addOrChangeService = addOrChangeManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds);
  
  sendResult(req, res, 'users/views/selectManageConsoleRoles', {
    csrfToken: req.csrfToken(),
    layout: 'sharedViews/layoutNew.ejs', 
    addOrChangeService,
    user,
    serviceSelectedByUser,
    manageConsoleRolesForSelectedService,
    userManageRoles,
    backLink: true,
    cancelLink: `/users/${user.id}/organisations`,
  });
};

module.exports = {
  getManageConsoleRoles,
  getSingleServiceForUser,
  addOrChangeManageConsoleServiceTitle,
  checkIfRolesChanged
};