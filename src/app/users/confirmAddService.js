'use strict';
const { getAllServices } = require('./../../infrastructure/applications');
const { listRolesOfService, addInvitationService, addUserService, updateInvitationService, updateUserService } = require('./../../infrastructure/access');
const { getUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const logger = require('./../../infrastructure/logger');

const get = async (req, res) => {
  const userId = req.params.uid;
  if (!req.session.user) {
    return res.redirect(`/users/${userId}/organisations`);
  }
  const userOrganisations = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), req.id) : await getUserOrganisations(userId, req.id);
  const organisationDetails = userOrganisations.find(x => x.organisation.id === req.params.orgId);

  const services = req.session.user.services.map(service => ({
    id: service.serviceId,
    name: '',
    roles: service.roles,
  }));
  const allServices = await getAllServices(req.id);
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const serviceDetails = allServices.services.find(x => x.id === service.id);
    const allRolesOfService = await listRolesOfService(service.id, req.id);
    const roleDetails = allRolesOfService.filter(x => service.roles.find(y => y.toLowerCase() === x.id.toLowerCase()));
    service.name = serviceDetails.name;
    service.roles = roleDetails;
  }

  return res.render('users/views/confirmAddService', {
    backLink: true,
    changeLink: req.session.user.isAddService ? `/users/${userId}/organisations/${req.params.orgId}` : `/users/${userId}/organisations/${req.params.orgId}/services/${req.session.user.services[0].serviceId}`,
    currentPage: 'users',
    csrfToken: req.csrfToken(),
    user: {
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
      isAddService: req.session.user.isAddService
    },
    services,
    organisationDetails,
  });
};

const post = async (req, res) => {
  const uid = req.params.uid;
  if (!req.session.user) {
    return res.redirect(`/users/${uid}/organisations`);
  }

  const organisationId = req.params.orgId;
  if (req.session.user.services) {
    for (let i = 0; i < req.session.user.services.length; i++) {
      const service = req.session.user.services[i];
      if (uid.startsWith('inv-')) {
        const invitationId = uid.substr(4);
        req.session.user.isAddService ?  await addInvitationService(invitationId, service.serviceId, organisationId, [], service.roles, req.id) : await updateInvitationService(invitationId, service.serviceId, organisationId, service.roles, req.id);
      } else {
        req.session.user.isAddService ? await addUserService(uid, service.serviceId, organisationId, service.roles, req.id) : await updateUserService(uid, service.serviceId, organisationId, service.roles, req.id);
      }
    }
  }

  if (req.session.user.isAddService) {
    logger.audit(`${req.user.email} (id: ${req.user.sub}) added services for organisation id: ${organisationId} for user ${req.session.user.email} (id: ${uid})`, {
      type: 'approver',
      subType: 'user-services-added',
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: uid,
      editedFields: [{
        name: 'add_services',
        newValue: req.session.user.services,
      }],
    });
    res.flash('info', `Services successfully added`);
  } else {
    logger.audit(`${req.user.email} (id: ${req.user.sub}) updated service ${req.session.user.services[0].name} for organisation id: ${organisationId}) for user ${req.session.user.email} (id: ${uid})`, {
      type: 'approver',
      subType: 'user-service-updated',
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: uid,
      editedFields: [{
        name: 'update_service',
        newValue: req.session.user.services,
      }],
    });
    res.flash('info', `${req.session.user.services[0].name} updated successfully`);
  }
  res.redirect(`/users/${uid}/services`)
};

module.exports = {
  get,
  post
};
