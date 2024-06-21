const { sendResult } = require('../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getAllServices, getServiceById } = require('../../infrastructure/applications')
const { listRolesOfService, getSingleUserService, getSingleInvitationService, addUserService, updateUserService } = require('../../infrastructure/access')


//! used to check if the user already has roles selected - called during if block, isAddService 
const getSingleServiceForUser = async (userId, organisationId, serviceId, correlationId) => {
  console.log('INSIDE IF getSingleServiceForUser')
  console.log('1: ', userId, '2: ',organisationId, '3: ', serviceId, '4: ', correlationId)
  const userService = await getSingleUserService(userId, serviceId, organisationId, correlationId);
  getManageConsoleRoles
  console.log('INSIDE userService', userService)
  const application = await getServiceById(serviceId, correlationId);
  return {
    id: userService.serviceId,
    roles: userService.roles,
    name: application.name
  }
};

const getManageConsoleRoles = async (req, res) => {
  console.log('!!!!!!!! INSIDE getManageConsoleRoles !!!!!!')
  const user = await getUserDetails(req);
  // console.log('getUserDetails has run:: ', user)
  // const services = await getAllServices()

  // // const temp = await getSingleUserService(user.id, req.params.sid, user.orgId) - should this return manage console roles? 
  // const temp = await getSingleUserService(user.id, user.serviceId, user.orgId)
  // console.log('TEMP: ', temp)
  // // returning undefined  

  // GRABS SELECTED SERVICE FROM PARAMS - in selectManageConsoleService.ejs and passed in href
  const singleService = await getServiceById(req.params.sid)
  console.log('getServiceById: ', singleService) // selected service id available here

  const manage = await getServiceById('manage') // manage id available here
  console.log('manage:: ', manage)

  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRoles = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)
  console.log('manageConsoleRoles inside getManageConsoleRoles:: ', manageConsoleRoles) // arr of role objects with role ids 

  let manageConsoleRoleIds = []

  manageConsoleRoles.forEach(obj => manageConsoleRoleIds.push(obj.id))

  console.log('manageConsoleRoleIds:: getManageConsoleRoles:: ', manageConsoleRoleIds)

  const selectedRoles = req.session.user.services ? req.session.user.services.find(x => x.serviceId === req.params.sid) : [];
  const totalNumberOfServices = req.session.user.isAddService ? req.session.user.services.length : 1;
  const currentService = req.session.user.isAddService ? req.session.user.services.findIndex(x => x.serviceId === req.params.sid) + 1 : 1;

  console.log('selected roles: getManageConsoleRoles:: ', selectedRoles) // [] EMPTY ARRAY - NOTHING SELECTED
  console.log('!!! req.session.user: ', req.session) // USER OBJECT W/ first and last name and email  - no ... from locals 

  const userRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  // selected roles visible in userRoles
  console.log('userRoles:: getManageConsoleRoles:: ', userRoles)
  console.log('userRoles.roles[0].id:: ', userRoles.roles[0].id)

  let selectedUserRoles = []

  userRoles.roles.forEach(role => selectedUserRoles.push(role.id))

  console.log('selectedUserRoles:: getManageConsoleRoles:: ', selectedUserRoles)

  //! ERROR FROM HERE - CHECKING IF USER ALREADY HAS A ROLE SELECTED
  // isAddService - looks to be added in associateServices.js - set to true 
  // if (!req.session.user.isAddService) {
  //   console.log('INSIDE IF BLOCK')
  // //   // console.log('!!! REQS', req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', req.params.sid, req.id) //! orgId undefined
  // const userRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
  //   console.log('userRoles: ', userRoles)
  //   req.session.user.services = [{
  //     serviceId: userRoles.id,
  //     roles: userRoles.roles.map(a => a.id),
  //     name: userRoles.name
  //   }]
  // }
  // console.log('req.session.user.services:: ', req.session.user.services)
 

  sendResult(req, res, 'users/views/selectManageConsoleRoles', {
    csrfToken: req.csrfToken(),
    layout: 'sharedViews/layoutNew.ejs', 
    user,
    singleService,
    selectedUserRoles,
    user: req.session.user,
    manageConsoleRoles,
    manageConsoleRoleIds,
    currentService,
    totalNumberOfServices,
    selectedRoles,
    // userRoles,
    // backLink: 'services',
    backLink: true,
    validationMessages: {},
    cancelLink: `/users/${user.id}/organisations`,
  });
};

const postManageConsoleRoles = async (req, res) => {
  console.log('!!!!!!!! INSIDE postManageConsoleRoles !!!!!!')
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`);
  }

  const userId = req.params.uid;
  let selectedRoles = req.body.role ? req.body.role : [];
  console.log('selectedRoles:: ', selectedRoles)


  // we want current service details so we know where/what we are posting
  // const currentService = req.session.user
  // console.log('currentService: postManageConsoleRoles: ', currentService)

  //todo - validation - CHECK ROLES FROM REQUEST ARE ACTUAL ROLES 
  // create util function and import in - repeated in both functions 
  
  const manage = await getServiceById('manage')
  console.log(manage)
  const manageConsoleRolesForAllServices = await listRolesOfService(manage.id)
  const manageConsoleRoles = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid)
  console.log('manageConsoleRoles:: ', manageConsoleRoles)

// loop through manageConsoleRoles print id 
let manageConsoleRoleIds = []

manageConsoleRoles.forEach(obj => manageConsoleRoleIds.push(obj.id))

console.log('manageConsoleRoleIds:: ', manageConsoleRoleIds)

  // selectedRoles.unshift('30CCF08E-59A6-4E4B-A00C-42')

// try catch inside updateUserService
selectedRoles.forEach(id => {
  if(!manageConsoleRoleIds.includes(id)) {
    console.log(`The id ${id} is not a valid id for this service`)
    return res.redirect(`/users/${req.params.uid}/organisations`);
    } 
    })
  // addUserService(userId, manage.id, selectedRoles )
  console.log('selectedRoles:: postManageConsoleRoles:: ', selectedRoles)
  // console.log('selectedRoles:: ', selectedRoles)
  updateUserService(userId, manage.id, '3de9d503-6609-4239-ba55-14f8ebd69f56', selectedRoles, req.id)

// what do we want to happen if the id is not a valid id? 



// for( let i = 0; i < manageConsoleRoles.length; i++) {
//   console.log(`manageConsoleRoles:: ${i}`, manageConsoleRoles[i].id)
//   manageConsoleRoleIds.push(manageConsoleRoles[i].id)
//   for(let j = 0; j < selectedRoles.length; j++) {
//     if (manageConsoleRoleIds.includes(selectedRoles[j])){
//       console.log(`This id: ${selectedRoles[j]} is in the manage console role ids array`)
//     }
//   }
//   if (!selectedRoles.includes(manageConsoleRoles[i].id)) {
//     console.log('True')
//     // return res.redirect(`/users/${req.params.uid}/organisations`)
//   } 
// }
  // console.log('req.session: postManageConsoleRoles: ', req.session) // approver / user info

  return res.redirect(`/users/${userId}/manage-console-services`);

  
};


module.exports = {
  getManageConsoleRoles,
  postManageConsoleRoles
};


