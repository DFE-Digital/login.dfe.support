const _ = require("lodash");
const config = require("./../../infrastructure/config");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const {
  getInvitationOrganisations,
} = require("./../../infrastructure/organisations");
const PolicyEngine = require("login.dfe.policy-engine");
const { getUserServiceRaw } = require("login.dfe.api-client/users");
const { getInvitationServiceRaw } = require("login.dfe.api-client/invitations");
const policyEngine = new PolicyEngine(config);

const getSingleServiceForUser = async (userId, organisationId, serviceId) => {
  const userService = userId.startsWith("inv-")
    ? await getInvitationServiceRaw({
        invitationId: userId.substr(4),
        serviceId,
        organisationId,
      })
    : await getUserServiceRaw({ userId, serviceId, organisationId });
  const application = await getServiceRaw({ by: { serviceId } });
  return {
    id: userService.serviceId,
    roles: userService.roles,
    name: application.name,
  };
};

const getViewModel = async (req) => {
  const userId = req.params.uid;
  const totalNumberOfServices = req.session.user.isAddService
    ? req.session.user.services.length
    : 1;
  const currentService = req.session.user.isAddService
    ? req.session.user.services.findIndex(
        (x) => x.serviceId === req.params.sid,
      ) + 1
    : 1;
  const serviceDetails = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const userOrganisations = userId.startsWith("inv-")
    ? await getInvitationOrganisations(userId.substr(4), req.id)
    : await getUserOrganisationsWithServicesRaw({ userId });
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === req.params.orgId,
  );
  const policyEngineResult =
    await policyEngine.getPolicyApplicationResultsForUser(
      userId.startsWith("inv-") ? undefined : userId,
      req.params.orgId,
      req.params.sid,
      req.id,
    );
  const serviceRoles = policyEngineResult.rolesAvailableToUser;
  const selectedRoles = req.session.user.services
    ? req.session.user.services.find((x) => x.serviceId === req.params.sid)
    : [];

  return {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    name: req.session.user
      ? `${req.session.user.firstName} ${req.session.user.lastName}`
      : "",
    user: req.session.user,
    validationMessages: {},
    backLink: true,
    organisationDetails,
    selectedRoles,
    serviceDetails,
    serviceRoles: serviceRoles.sort((a, b) => a.name.localeCompare(b.name)),
    currentService,
    totalNumberOfServices,
    cancelLink: req.session.user.isAddService
      ? `/users/${userId}/organisations`
      : `/users/${userId}/services`,
  };
};

const get = async (req, res) => {
  const userId = req.params.uid;
  if (!req.session.user) {
    return res.redirect(`/users/${userId}/organisations`);
  }

  if (!req.session.user.isAddService) {
    const userRoles = await getSingleServiceForUser(
      req.params.uid,
      req.params.orgId,
      req.params.sid,
    );
    req.session.user.services = [
      {
        serviceId: userRoles.id,
        roles: userRoles.roles.map((a) => a.id),
        name: userRoles.name,
      },
    ];
  }

  const model = await getViewModel(req);
  return res.render("users/views/associateRoles", model);
};

const post = async (req, res) => {
  const userId = req.params.uid;
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`);
  }

  const currentService = req.session.user.services.findIndex(
    (x) => x.serviceId === req.params.sid,
  );
  let selectedRoles = req.body.role ? req.body.role : [];

  if (!(selectedRoles instanceof Array)) {
    selectedRoles = [req.body.role];
  }

  if (haveRolesBeenUpdated(req, currentService, selectedRoles)) {
    return res.redirect(`/users/${userId}/services`);
  }

  req.session.user.services[currentService].roles = selectedRoles;

  const policyValidationResult = await policyEngine.validate(
    userId.startsWith("inv-") ? undefined : userId,
    req.params.orgId,
    req.params.sid,
    selectedRoles,
    req.id,
  );
  if (policyValidationResult && policyValidationResult.length > 0) {
    const model = await getViewModel(req);
    model.validationMessages.roles = policyValidationResult.map(
      (x) => x.message,
    );
    return res.render("users/views/associateRoles", model);
  }

  if (currentService < req.session.user.services.length - 1) {
    const nextService = currentService + 1;
    return res.redirect(`${req.session.user.services[nextService].serviceId}`);
  } else {
    return res.redirect(
      `/users/${req.params.uid}/organisations/${req.params.orgId}/confirm`,
    );
  }
};

const haveRolesBeenUpdated = (req, currentService, selectedRoles) => {
  if (
    req.session.user.services &&
    req.session.user.services[currentService].roles &&
    req.session.user.services[currentService].roles.length > 0
  ) {
    return _.isEqual(
      req.session.user.services[currentService].roles.sort(),
      selectedRoles.sort(),
    );
  }
  return false;
};

module.exports = {
  get,
  post,
};
