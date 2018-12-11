'use strict';
const { getUserOrganisations } = require('./../../infrastructure/organisations');
const { getAllServicesForUserInOrg } = require('./utils');
const { getAllServices } = require('./../../infrastructure/applications')

const getAllAvailableServices = async (req) => {
  const allServices = await getAllServices();
  let externalServices = allServices.services.filter(x => x.isExternalService === true && !(x.relyingParty && x.relyingParty.params && x.relyingParty.params.hideApprover === 'true'));
  if (req.params.uid) {
    const allUserServicesInOrg = await getAllServicesForUserInOrg(req.params.uid, req.params.orgId, req.id);
    externalServices = externalServices.filter(ex => !allUserServicesInOrg.find(as => as.id === ex.id));
  }
  return externalServices;
};

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`)
  }
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);
  const organisationDetails = userOrganisations.find(x => x.organisation.id === req.params.orgId);
  const externalServices = await getAllAvailableServices(req);

  const model = {
    csrfToken: req.csrfToken(),
    name: req.session.user ? `${req.session.user.firstName} ${req.session.user.lastName}` : '',
    user: req.session.user,
    validationMessages: {},
    backLink: userOrganisations.length > 1 ? `/users/${req.params.uid}/select-organisation` : `/users/${req.params.uid}/organisations`,
    organisationDetails,
    services: externalServices,
    selectedServices: req.session.user.services ? req.session.user.services : [],
  };

  res.render('users/views/associateServices', model);
};

const validate = async (req) => {
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);
  const organisationDetails = userOrganisations.find(x => x.organisation.id === req.params.orgId);
  const externalServices = await getAllAvailableServices(req);
  const model = {
    name: req.session.user ? `${req.session.user.firstName} ${req.session.user.lastName}` : '',
    user: req.session.user,
    validationMessages: {},
    backLink: userOrganisations.length > 1 ? `/users/${req.params.uid}/select-organisation` : `/users/${req.params.uid}/organisations`,
    organisationDetails,
    services: externalServices,
    selectedServices: req.body.service,
  };
  if (!model.selectedServices) {
    model.validationMessages.services = 'At least one service must be selected';
  }
  return model;
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`)
  }
  const model = await validate(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('users/views/associateServices', model);
  }

  let selectedServices = model.selectedServices;
  if (!(selectedServices instanceof Array)) {
    selectedServices = [req.body.service];
  }

  req.session.user.services = selectedServices.map((serviceId) => {
    const existingServiceSelections = req.session.user.services ? req.session.user.services.find(x => x.serviceId === serviceId) : undefined;
    return {
      serviceId,
      roles: existingServiceSelections ? existingServiceSelections.roles : [],
    };
  });

  const service = req.session.user.services[0].serviceId;
  return res.redirect(`${req.params.orgId}/services/${service}`)

};

module.exports = {
  get,
  post,
};
