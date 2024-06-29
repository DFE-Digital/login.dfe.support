const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getAllServices, getServiceById } = require('../../infrastructure/applications')
const { listRolesOfService, getSingleUserService, getSingleInvitationService, addUserService, updateUserService, getServicesByUserId } = require('../../infrastructure/access');
const { use } = require('passport');
// const { getSingleServiceForUser } = require('./associateRoles')


const getSingleServiceForUser = async (userId, organisationId, serviceId, correlationId) => {
  const userService = userId.startsWith('inv-') ? await getSingleInvitationService(userId.substr(4), serviceId, organisationId, correlationId) : await getSingleUserService(userId, serviceId, organisationId, correlationId);
  const application = await getServiceById(serviceId, correlationId);
  return {
    id: userService.serviceId,
    roles: userService.roles,
    name: application.name
  }
};

// triggered when we click service name in selectManageConsoleService.ejs
const getManageConsoleRoles = async (req, res) => {
  console.log('!!!!!!!! INSIDE getManageConsoleRoles !!!!!!')

  //* Grab manage details - need id to check if user has manage service 
  const manage = await getServiceById('manage') //* manage id available here
  const user = await getUserDetails(req);
  
  //* check user has manage service
  //const getSingleUserService = async (userId, serviceId, organisationId, correlationId)
  const hasManageService = await getSingleUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', req.id)
  console.log('hasService:: ', hasManageService)   //! Always returning undefined
  
  //* Grab all manageConsoleRoles that exist, not what the user has, and filter by selected service id - gives list of acceptable role ids to be added
  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)

  //* Grab the role ids for the selected service, which we pass into ejs to compare with user selected role ids
  let manageConsoleRoleIds = []
  manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id))
  console.log('manageConsoleRoleIds:: ', manageConsoleRoleIds)

  //! getSingleServiceForUser should give all user manage roles selected by user from before this session?  
  //* check for all manage roles user has selected previously, for all services - pass in all roles
  let userManageRoles = undefined;
  
  if (hasManageService) {
    //* if hasManageService, get the roles
    userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
    console.log('userManageRoles:: getManageConsoleRoles:: ', userManageRoles) // roles selected
  } else {
    //* if they do not have the manage service, we add the service
    // they will not have any roles - empty arr should be ok, first time using service/adding roles. 
    let selectedRoles = []
    addUserService(user.id, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', selectedRoles, req.id)
    //todo: then grab roles - assume it would be empty, can change this
    userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
    console.log('userManageRoles:: getManageConsoleRoles:: ', userManageRoles) // roles selected

    //todo - temp check to see if service has been added
    const checkHasService = await getSingleUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', req.id)
    console.log('checkHasService:: ', checkHasService) //! still undefined 
  }

  //* Returns the selected service object eg: Accounts return
  const serviceSelectedByUser = await getServiceById(req.params.sid) //* selected service eg 'Accounts return'. ID available here 

  sendResult(req, res, 'users/views/selectManageConsoleRoles', {
    csrfToken: req.csrfToken(),
    layout: 'sharedViews/layoutNew.ejs', 
    user,
    serviceSelectedByUser,
    manageConsoleRolesForSelectedService,
    userManageRoles,
    // backLink: 'services',
    backLink: true,
    validationMessages: {
      roleSelection: 'This is an error'
    },
    cancelLink: `/users/${user.id}/organisations`,
  });
};


const postManageConsoleRoles = async (req, res) => {
  console.log('!!!!!!!! INSIDE postManageConsoleRoles !!!!!!')

  const userId = req.params.uid;
  // selectedRoles are the roles sent in post request
  //! if selects only one role - trys to loop through string instead of array 
  let selectedRolesForThisService = req.body.role ? req.body.role : [];

  if (!(selectedRolesForThisService instanceof Array)) {
    selectedRolesForThisService = [req.body.role];
  }
  console.log('selectedRolesForThisService:: ', selectedRolesForThisService)

  //todo - validation - CHECK ROLES FROM REQUEST ARE ACTUAL ROLES 
  // collecting all valid roles for the service:
  const manage = await getServiceById('manage')
  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)
  console.log('manageConsoleRoles:: ', manageConsoleRolesForSelectedService)

// grabbing the service role ids for comparison: 
let manageConsoleRoleIds = []

manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id))

console.log('manageConsoleRoleIds:: ', manageConsoleRoleIds)

  // selectedRoles.unshift('30CCF08E-59A6-4E4B-A00C-42')

// validation error - try/catch? 
//! problem when only selecting 1 service

for (let i =0; i < selectedRolesForThisService.length; i++) {
  if(!manageConsoleRoleIds.includes(selectedRolesForThisService[i])) {
    console.log('NOT INCLUDED:: ', selectedRolesForThisService[i])
    // console.log(`The id ${selectedRoles[i]} is not a valid id for this service`)
    // return res.redirect(`/users/${req.params.uid}/organisations`);
    } 
}

// selectedRoles.forEach(id => {
//   if(!manageConsoleRoleIds.includes(id)) {
//     console.log(`The id ${id} is not a valid id for this service`)
//     return res.redirect(`/users/${req.params.uid}/organisations`);
//     } 
//     })


  //* will return undefined if user doesn't have service  - would break if user didnt have manage access
  //const getSingleUserService = async (userId, serviceId, organisationId, correlationId)
  const hasService = await getSingleUserService(req.params.uid, manage.id,'3de9d503-6609-4239-ba55-14f8ebd69f56', req.id)
  console.log('hasService:: postManageConsoleRoles: ', hasService)

let userRoles = undefined;
let allSelectedRoles = []

if (hasService) {
  console.log('INSIDE IF BLOCK')
  userRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  let userRoleIds = []
  userRoles.roles.forEach(role => userRoleIds.push(role.id))
  allSelectedRoles = [...userRoleIds, ...selectedRolesForThisService]
  updateUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', allSelectedRoles, req.id)
} else {
  addUserService(req.params.uid, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', allSelectedRoles, req.id)
  userRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  //const getSingleUserService = async (userId, serviceId, organisationId, correlationId)
  const checkHasService = await getSingleUserService(req.params.uid, manage.id,'3de9d503-6609-4239-ba55-14f8ebd69f56', req.id)
}


  // //! which service checks the services a user already has? - check if user has the selected service:
  // //?? CHECKING IF THEY HAVE THE SELECTED SERVICE 'ACCOUNTS RETURN' FOR EXAMPLE, NOT MANAGE??
  // const userServices = await getServicesByUserId(userId, req.id)
  // console.log('userServices:: postManageConsoleRoles:: ', userServices )
  // console.log('userServices:: ', userServices.roles )
  // //! if not,
  // check if user has the manage access roles already selected, getSingleUserService if not
  // addUserService(userId, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', selectedRoles, req.id)
  //! else 

  return res.redirect(`/users/${userId}/manage-console-services`);
};


module.exports = {
  getManageConsoleRoles,
  postManageConsoleRoles
};


