const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails} = require('./utils');
const { getServiceById } = require('../../infrastructure/applications')
const { listRolesOfService, getSingleUserService, getSingleInvitationService, updateUserService } = require('../../infrastructure/access');

const getSingleServiceForUser = async (userId, organisationId, serviceId, correlationId) => {
  console.log('inside getSingleServiceForUser:: ', userId, organisationId, serviceId, correlationId)
  const userService = userId.startsWith('inv-') ? await getSingleInvitationService(userId.substr(4), serviceId, organisationId, correlationId) : await getSingleUserService(userId, serviceId, organisationId, correlationId);

  console.log('!! userService:: ', userService)
  const application = await getServiceById(serviceId, correlationId);
  console.log('userService:: leaving getSingleServiceForUser:: ', userService)
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

const checkIfRolesChanged =  (rolesSelectedBeforeSession, newRolesSelected) => {
  if (rolesSelectedBeforeSession.length !== newRolesSelected.length) {
    return false;
  }

  let rolesSelectedBeforeSessionSorted = rolesSelectedBeforeSession.slice().sort();
  let newRolesSelectedSorted = newRolesSelected.slice().sort();

  for(let i = 0; i < rolesSelectedBeforeSessionSorted.length; i++) {
    if (rolesSelectedBeforeSessionSorted[i] !== newRolesSelectedSorted[i]) {
      return false;
    }
  }
  return true;
}

const getManageConsoleRoles = async (req, res) => {
  console.log('BEING CALLED!')
  const manage = await getServiceById('manage');
  console.log('manage:: ', manage)

  const serviceSelectedByUser = await getServiceById(req.params.sid);
  console.log('serviceSelectedByUser:: ', serviceSelectedByUser)

  const user = await getUserDetails(req);
  console.log('user:: ', user)

  const userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  console.log('userManageRoles:: ', userManageRoles)

  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id);
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid);
  console.log('manageConsoleRolesForSelectedService:: ', manageConsoleRolesForSelectedService);
  
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


const postManageConsoleRoles = async (req, res) => {

  const manage = await getServiceById('manage') 
  const userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  const user = await getUserDetails(req);
  const serviceSelectedByUser = await getServiceById(req.params.sid)

  let rolesSelectedNew = req.body.role ? req.body.role : [];
  if (!(rolesSelectedNew instanceof Array)) {
    rolesSelectedNew = [req.body.role];
  }

  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)
  let manageConsoleRoleIds = []
  manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id))
  
  const addOrChangeService = addOrChangeManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds)
  
  //* re-render role selection view with error message if invaild service is sent in request 
  for (let i =0; i < rolesSelectedNew.length; i++) {
    if(!manageConsoleRoleIds.includes(rolesSelectedNew[i])) {
      sendResult(req, res, 'users/views/selectManageConsoleRoles', {
        csrfToken: req.csrfToken(),
        layout: 'sharedViews/layoutNew.ejs', 
        user,
        serviceSelectedByUser,
        addOrChangeService,
        manageConsoleRolesForSelectedService,
        userManageRoles,
        backLink: true,
        validationMessages: {
          roleSelection: 'You have selected an invalid role for this service'
        },
        cancelLink: `/users/${user.id}/organisations`,
      });
    } 
  }
  
    let rolesSelectedBeforeSession = []
    userManageRoles.roles.forEach(role => rolesSelectedBeforeSession.push(role.id))
    
    const allSelectedRoles = [...new Set(rolesSelectedBeforeSession.concat(rolesSelectedNew))]
    const rolesToRemove = manageConsoleRoleIds.filter(id => !rolesSelectedNew.includes(id));
    const filteredAllSelectedRoles = allSelectedRoles.filter(id => !rolesToRemove.includes(id))
    const rolesForThisServiceSelectedBeforeSession = rolesSelectedBeforeSession.filter(id => rolesSelectedNew.includes(id))
    
    const rolesHaveNotChanged = checkIfRolesChanged(rolesForThisServiceSelectedBeforeSession, rolesSelectedNew)

    if (rolesHaveNotChanged && filteredAllSelectedRoles.length === allSelectedRoles.length) {
      return res.redirect(`/users/${req.params.uid}/manage-console-services`);
    }

    updateUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', filteredAllSelectedRoles, req.id)
    res.flash('info', [`Roles updated`,`The selected roles have been updated for ${serviceSelectedByUser.name}`] );  
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
};

module.exports = {
  getManageConsoleRoles,
  postManageConsoleRoles,
  getSingleServiceForUser,
  addOrChangeManageConsoleServiceTitle,
  checkIfRolesChanged
};


