'use strict';
const config = require('./../../infrastructure/config');
const { getServiceById } = require('./../../infrastructure/applications');
const { getUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const PolicyEngine = require('login.dfe.policy-engine');
const policyEngine = new PolicyEngine(config);

const get = async (req, res) => {
  const userId = req.params.uid;
  if (!req.session.user) {
    return res.redirect(`/users/${userId}/organisations`);
  }

  const totalNumberOfServices = req.session.user.services.length;
  const currentService = req.session.user.services.findIndex(x => x.serviceId === req.params.sid) + 1;

  const serviceDetails = await getServiceById(req.params.sid, req.id);
  const userOrganisations = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), req.id) : await getUserOrganisations(userId, req.id);
  const organisationDetails = userOrganisations.find(x => x.organisation.id === req.params.orgId);
  const serviceRoles = await policyEngine.getRolesAvailableForUser(userId, req.params.orgId, req.params.sid, req.id);
  const selectedRoles = req.session.user.services ? req.session.user.services.find(x => x.serviceId === req.params.sid) : [];

  const model = {
    csrfToken: req.csrfToken(),
    name: req.session.user ? `${req.session.user.firstName} ${req.session.user.lastName}` : '',
    user: req.session.user,
    validationMessages: {},
    backLink: true,
    organisationDetails,
    selectedRoles,
    serviceDetails,
    serviceRoles,
    currentService,
    totalNumberOfServices,
  };
  return res.render('users/views/associateRoles', model);
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`);
  }

  const currentService = req.session.user.services.findIndex(x => x.serviceId === req.params.sid);
  let selectedRoles = req.body.role ? req.body.role : [];

  if(!(selectedRoles instanceof Array)){
    selectedRoles= [req.body.role];
  }
  req.session.user.services[currentService].roles = selectedRoles;

  if (currentService < req.session.user.services.length -1) {
    const nextService = currentService + 1;
    return res.redirect(`${req.session.user.services[nextService].serviceId}`)
  } else {
    return res.redirect(`/users/${req.params.uid}/organisations/${req.params.orgId}/confirm`);
  }
};

module.exports = {
  get,
  post
};
