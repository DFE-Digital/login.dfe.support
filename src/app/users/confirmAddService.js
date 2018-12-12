'use strict';
const { getAllServices } = require('./../../infrastructure/applications');
const { listRolesOfService, addInvitationService, addUserService } = require('./../../infrastructure/access');
const { getUserOrganisations } = require('./../../infrastructure/organisations');

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`);
  }
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);
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
    changeLink: `/users/${req.params.uid}/organisations/${req.params.orgId}`,
    currentPage: 'users',
    csrfToken: req.csrfToken(),
    user: {
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
    },
    services,
    organisationDetails,
  });
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`);
  }

  let uid = req.params.uid;
  const organisationId = req.params.orgId;
  if (req.session.user.services) {
    for (let i = 0; i < req.session.user.services.length; i++) {
      const service = req.session.user.services[i];
      if (uid.startsWith('inv-')) {
        const invitationId = uid.substr(4);
        await addInvitationService(invitationId, service.serviceId, organisationId, [], service.roles, req.id);
      } else {
        await addUserService(uid, service.serviceId, organisationId, service.roles, req.id);
      }
    }
  }
  res.flash('info', `Services successfully added`);
  res.redirect(`/users/${uid}/services`)
};

module.exports = {
  get,
  post
};
