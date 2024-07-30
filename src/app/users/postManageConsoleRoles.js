const config = require('../../infrastructure/config');
const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails} = require('./utils');
const { getServiceById } = require('../../infrastructure/applications')
const { listRolesOfService, updateUserService } = require('../../infrastructure/access');
const { getSingleServiceForUser, addOrChangeManageConsoleServiceTitle, checkIfRolesChanged }= require('./getManageConsoleRoles')

const postManageConsoleRoles = async (req, res) => {

    let rolesSelectedNew = req.body.role ? req.body.role : [];
    if (!(rolesSelectedNew instanceof Array)) {
      rolesSelectedNew = [req.body.role];
    }
  
    const manage = await getServiceById('manage');
    const serviceSelectedByUser = await getServiceById(req.params.sid);
    const user = await getUserDetails(req);
    const userManageRoles = await getSingleServiceForUser(req.params.uid, config.access.identifiers.departmentForEducation, manage.id, req.id);
    const manageConsoleRolesForAllServices = await listRolesOfService(manage.id);
    const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid);
    
    let manageConsoleRoleIds = [];
    manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id));
    
    const addOrChangeService = addOrChangeManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds);
    
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
    
    let rolesSelectedBeforeSession = [];
    userManageRoles.roles.forEach(role => rolesSelectedBeforeSession.push(role.id));

    const allSelectedRoles = [...new Set(rolesSelectedBeforeSession.concat(rolesSelectedNew))];
    const rolesToRemove = manageConsoleRoleIds.filter(id => !rolesSelectedNew.includes(id));
    const filteredAllSelectedRoles = allSelectedRoles.filter(id => !rolesToRemove.includes(id));
    const rolesForThisServiceSelectedBeforeSession = rolesSelectedBeforeSession.filter(id => rolesSelectedNew.includes(id));
    const rolesHaveNotChanged = checkIfRolesChanged(rolesForThisServiceSelectedBeforeSession, rolesSelectedNew);

    if (rolesHaveNotChanged && filteredAllSelectedRoles.length === allSelectedRoles.length) {
      return res.redirect(`/users/${req.params.uid}/manage-console-services`);
    }

    updateUserService(req.params.uid, manage.id, config.access.identifiers.departmentForEducation, filteredAllSelectedRoles, req.id);
    res.flash('info', [`Roles updated`,`The selected roles have been updated for ${serviceSelectedByUser.name}`] );  
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
  }

  module.exports = postManageConsoleRoles;