const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails, addOrEditManageConsoleServiceTitle, checkIfRolesChanged } = require('./utils');
const { getServiceById, getAllServices } = require('../../infrastructure/applications')
const { listRolesOfService, getSingleUserService, getSingleInvitationService, addUserService, updateUserService } = require('../../infrastructure/access');

const getSingleServiceForUser = async (userId, organisationId, serviceId, correlationId) => {
  const userService = userId.startsWith('inv-') ? await getSingleInvitationService(userId.substr(4), serviceId, organisationId, correlationId) : await getSingleUserService(userId, serviceId, organisationId, correlationId);
  const application = await getServiceById(serviceId, correlationId);
  return {
    id: userService.serviceId,
    roles: userService.roles,
    name: application.name
  }
};

const getManageConsoleRoles = async (req, res) => {
  const manage = await getServiceById('manage');
  const user = await getUserDetails(req);
  const serviceSelectedByUser = await getServiceById(req.params.sid);
  const userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id);
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid);

  let manageConsoleRoleIds = [];
  manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id));
  const addOrEditService = await addOrEditManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds);
  
  sendResult(req, res, 'users/views/selectManageConsoleRoles', {
    csrfToken: req.csrfToken(),
    layout: 'sharedViews/layoutNew.ejs', 
    addOrEditService,
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
  console.log('Service selected by user:: ', serviceSelectedByUser)
  let rolesSelectedNew = req.body.role ? req.body.role : [];
  if (!(rolesSelectedNew instanceof Array)) {
    rolesSelectedNew = [req.body.role];
  }

  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)
  let manageConsoleRoleIds = []
  manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id))
  
  const addOrEditService = await addOrEditManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds)
  
  //* re-render role selection view with error message if invaild service is sent in request 
  for (let i =0; i < rolesSelectedNew.length; i++) {
    if(!manageConsoleRoleIds.includes(rolesSelectedNew[i])) {
      sendResult(req, res, 'users/views/selectManageConsoleRoles', {
        csrfToken: req.csrfToken(),
        layout: 'sharedViews/layoutNew.ejs', 
        user,
        serviceSelectedByUser,
        addOrEditService,
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
    const rolesHaveNotChanged = await checkIfRolesChanged(rolesForThisServiceSelectedBeforeSession, rolesSelectedNew)

    if (rolesHaveNotChanged && filteredAllSelectedRoles.length === allSelectedRoles.length) {
      return res.redirect(`/users/${req.params.uid}/manage-console-services`);
    }

    updateUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', filteredAllSelectedRoles, req.id)
    res.flash('info', `The selected roles have been added to ${serviceSelectedByUser.name}` );  
    // res.flash('messages', {line1: 'Roles added', line2: `The selected roles have been added to ${serviceSelectedByUser.name}`} );
    // res.flash('info', {line1: 'Roles added', line2: `The selected roles have been added to ${serviceSelectedByUser.name}`} );
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
};

module.exports = {
  getManageConsoleRoles,
  postManageConsoleRoles
};


