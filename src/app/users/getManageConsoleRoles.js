const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails, addOrEditManageConsoleServiceTitle } = require('./utils');
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

  //* Grab manage details - need id to check if user has manage service 
  const manage = await getServiceById('manage') 
  const user = await getUserDetails(req);
  
  // todo - rework DO NOT NEED ADD MANAGE SERVICE
  //* check user has manage service
  const hasManageService = await getSingleUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', req.id)  

  //* Grab all manageConsoleRoles that exist, not what the user has, and filter by selected service id - gives list of acceptable role ids to be added
  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)

  //* Grab the role ids for the selected service, which we pass into ejs to compare with user selected role ids
  let manageConsoleRoleIds = []
  manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id))

  // todo - rework DO NOT NEED ADD MANAGE SERVICE
  //* check for all manage roles user has selected previously, for all services - pass in all roles
  let userManageRoles = undefined;
  if (hasManageService) {
    userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  } else {
    let selectedRoles = []
    addUserService(user.id, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', selectedRoles, req.id)
    userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  }

  const addOrEditService = await addOrEditManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds)

  //* Returns the selected service object eg: Accounts return
  const serviceSelectedByUser = await getServiceById(req.params.sid) //* selected service eg 'Accounts return'. ID available here 
  
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

  const services = await getAllServices()

  const manage = await getServiceById('manage') 
  // todo - rework DO NOT NEED ADD MANAGE SERVICE
  const hasService = await getSingleUserService(req.params.uid, manage.id,'3de9d503-6609-4239-ba55-14f8ebd69f56', req.id)

  let userManageRoles = undefined;
  if (hasService) {
    userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  }
  const user = await getUserDetails(req);
  const serviceSelectedByUser = await getServiceById(req.params.sid) //* selected service eg 'Accounts return'. ID available here
  let rolesSelectedNew = req.body.role ? req.body.role : [];

  if (!(rolesSelectedNew instanceof Array)) {
    rolesSelectedNew = [req.body.role];
  }

  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)

  let manageConsoleRoleIds = []
  manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id))

  const addOrEditService = await addOrEditManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds)

  //* re-render role selection view with error message if invaild service id sent in request 
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

if (hasService) {
    let rolesSelectedBeforeSession = []
    // userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
    userManageRoles.roles.forEach(role => rolesSelectedBeforeSession.push(role.id))
    
    const allSelectedRoles = [...new Set(rolesSelectedBeforeSession.concat(rolesSelectedNew))]
    const rolesToRemove = manageConsoleRoleIds.filter(id => !rolesSelectedNew.includes(id));
    const filteredallSelectedRoles = allSelectedRoles.filter(id => !rolesToRemove.includes(id))

    updateUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', filteredallSelectedRoles, req.id)
    res.flash('info', `Roles have been successfully updated`);
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
  } else {
    // todo - rework DO NOT NEED ADD MANAGE SERVICE
    //! Should we be adding service here? Should user be able to get to this point without manage access? 
    addUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', rolesSelectedNew, req.id)
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
  }
};

module.exports = {
  getManageConsoleRoles,
  postManageConsoleRoles
};


