const config = require("./../../infrastructure/config");
const {
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const {
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");
const { getAllServicesForUserInOrg } = require("./utils");
const { getAllServices } = require("../services/utils");
const PolicyEngine = require("login.dfe.policy-engine");
const policyEngine = new PolicyEngine(config);

const getAllAvailableServices = async (req) => {
  const allServices = await getAllServices();
  let externalServices = allServices.services.filter(
    (x) =>
      x.isExternalService === true &&
      !(
        x.relyingParty &&
        x.relyingParty.params &&
        x.relyingParty.params.hideSupport === "true"
      ),
  );
  if (req.params.uid) {
    const allUserServicesInOrg = await getAllServicesForUserInOrg(
      req.params.uid,
      req.params.orgId,
    );
    externalServices = externalServices.filter(
      (ex) => !allUserServicesInOrg.find((as) => as.id === ex.id),
    );
  }
  const servicesNotAvailableThroughPolicies = [];
  for (let i = 0; i < externalServices.length; i++) {
    const policyResult = await policyEngine.getPolicyApplicationResultsForUser(
      !req.params.uid || req.params.uid.startsWith("inv-")
        ? undefined
        : req.params.uid,
      req.params.orgId,
      externalServices[i].id,
      req.id,
    );
    if (!policyResult.serviceAvailableToUser) {
      servicesNotAvailableThroughPolicies.push(externalServices[i].id);
    }
  }
  return externalServices.filter(
    (x) => !servicesNotAvailableThroughPolicies.find((y) => x.id === y),
  );
};

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`);
  }
  const userId = req.params.uid;
  const userOrganisations = userId.startsWith("inv-")
    ? await getInvitationOrganisationsRaw({ invitationId: userId.substr(4) })
    : await getUserOrganisationsWithServicesRaw({ userId });
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === req.params.orgId,
  );
  const externalServices = await getAllAvailableServices(req);

  const model = {
    csrfToken: req.csrfToken(),
    name: req.session.user
      ? `${req.session.user.firstName} ${req.session.user.lastName}`
      : "",
    user: req.session.user,
    validationMessages: {},
    layout: "sharedViews/layout.ejs",
    backLink:
      userOrganisations.length > 1
        ? `/users/${req.params.uid}/select-organisation`
        : `/users/${req.params.uid}/organisations`,
    organisationDetails,
    services: externalServices,
    selectedServices: req.session.user.services
      ? req.session.user.services
      : [],
  };

  res.render("users/views/associateServices", model);
};

const validate = async (req) => {
  const userId = req.params.uid;
  const userOrganisations = userId.startsWith("inv-")
    ? await getInvitationOrganisationsRaw(userId.substr(4), req.id)
    : await getUserOrganisationsWithServicesRaw({ userId });
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === req.params.orgId,
  );
  const externalServices = await getAllAvailableServices(req);
  let selectedServices = [];
  if (req.body.service && req.body.service instanceof Array) {
    selectedServices = req.body.service;
  } else if (req.body.service) {
    selectedServices = [req.body.service];
  }
  const model = {
    name: req.session.user
      ? `${req.session.user.firstName} ${req.session.user.lastName}`
      : "",
    user: req.session.user,
    validationMessages: {},
    layout: "sharedViews/layout.ejs",
    backLink:
      userOrganisations.length > 1
        ? `/users/${req.params.uid}/select-organisation`
        : `/users/${req.params.uid}/organisations`,
    organisationDetails,
    services: externalServices,
    selectedServices,
  };
  if (model.selectedServices.length < 1) {
    model.validationMessages.services = "At least one service must be selected";
  }
  if (
    selectedServices.filter(
      (sid) =>
        !externalServices.find((s) => s.id.toLowerCase() === sid.toLowerCase()),
    ).length > 0
  ) {
    model.validationMessages.services =
      "A service was selected that is no longer available";
  }
  return model;
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/users/${req.params.uid}/organisations`);
  }
  const model = await validate(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("users/views/associateServices", model);
  }

  req.session.user.services = model.selectedServices.map((serviceId) => {
    const existingServiceSelections = req.session.user.services
      ? req.session.user.services.find((x) => x.serviceId === serviceId)
      : undefined;
    return {
      serviceId,
      roles: existingServiceSelections ? existingServiceSelections.roles : [],
    };
  });
  req.session.user.isAddService = true;

  const service = req.session.user.services[0].serviceId;
  return res.redirect(`${req.params.orgId}/services/${service}`);
};

module.exports = {
  get,
  post,
};
