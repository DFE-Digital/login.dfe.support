const postManageConsoleRoles = async (req, res) => {
    const userId = req.params.uid;
    if (!req.session.user) {
      return res.redirect(`/users/${req.params.uid}/organisations`);
    }

    const currentService = req.session.user

    console.log('userId: postManageConsoleRoles: ', userId)
    console.log('currentService: postManageConsoleRoles: ', currentService)

    return res.redirect(`/users/${userId}/services`);
  
    // const currentService = req.session.user.services.findIndex(x => x.serviceId === req.params.sid);
    // let selectedRoles = req.body.role ? req.body.role : [];
  
    // if (!(selectedRoles instanceof Array)) {
    //   selectedRoles = [req.body.role];
    // }
  
    // if(haveRolesBeenUpdated(req, currentService, selectedRoles)){
    //   return res.redirect(`/users/${userId}/services`);
    // }
  
    // req.session.user.services[currentService].roles = selectedRoles;
  
    // const policyValidationResult = await policyEngine.validate(userId.startsWith('inv-') ? undefined : userId, req.params.orgId, req.params.sid, selectedRoles, req.id);
    // if (policyValidationResult && policyValidationResult.length > 0) {
    //   const model = await getViewModel(req);
    //   model.validationMessages.roles = policyValidationResult.map(x => x.message);
    //   return res.render('users/views/associateRoles', model);
    // }
  
    // if (currentService < req.session.user.services.length - 1) {
    //   const nextService = currentService + 1;
    //   return res.redirect(`${req.session.user.services[nextService].serviceId}`);
    // } else {
    //   return res.redirect(`/users/${req.params.uid}/organisations/${req.params.orgId}/confirm`);
    // }
  };
  
//   const haveRolesBeenUpdated= (req, currentService, selectedRoles) => {
//     if(req.session.user.services
//         && (req.session.user.services[currentService].roles && req.session.user.services[currentService].roles.length > 0)){
//       return _.isEqual(req.session.user.services[currentService].roles.sort(),selectedRoles.sort());
//     }
//     return false;
//   }

module.exports = postManageConsoleRoles;

// const { sendResult } = require('../../infrastructure/utils');
// const { getUserDetails } = require('./utils');
// const { getAllServices, getServiceById } = require('../../infrastructure/applications')
// const { listRolesOfService, getSingleUserService } = require('../../infrastructure/access')

// const getAddManageConsoleRoles = async (req, res) => {
//   const user = await getUserDetails(req);
//   const services = await getAllServices()
//   // pass in manage console id, not url params - HARD CODE ? getsRVICEby Id manage
//   // const list = await listRolesOfService(req.params.sid)

//   // Which id? these are different - params comes from selectManageConsoleService.ejs > getAllServices array called in getManageConsoleServices
//   console.log('PARAMS SERV ID: ', req.params.sid, 'USER OBJ SERV ID: ', user.serviceId)

//   // const temp = await getSingleUserService(user.id, req.params.sid, user.orgId) - should this return manage console roles? 
//   const temp = await getSingleUserService(user.id, user.serviceId, user.orgId)

//   // move to utils/helper function and import in? - using for the service name above check box
//   // todo - replace with getServiceById in infrastructure/applications/api
//   // const singleService = services.services.find(service => service.id === req.params.sid)

//   const singleService = await getServiceById(req.params.sid)

//   const manage = await getServiceById('manage')

//   const list = await listRolesOfService(manage.id)
//   const manageConsoleRoles = list.filter(service => service.code.split('_')[0] === req.params.sid)

//   const selectedRoles = req.session.user.services ? req.session.user.services.find(x => x.serviceId === req.params.sid) : [];

//   sendResult(req, res, 'users/views/selectManageConsoleRoles', {
//     csrfToken: req.csrfToken(),
//     layout: 'sharedViews/layoutNew.ejs', 
//     user,
//     singleService,
//     manageConsoleRoles,
//     selectedRoles,
//     // backLink: 'services',
//     backLink: true,
//     validationMessages: {},
//     cancelLink: `/users/${user.id}/organisations`,
//   });
// };

// module.exports = getAddManageConsoleRoles;