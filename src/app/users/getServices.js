const {
  sendResult,
  isInternalEntraUser,
} = require("../../infrastructure/utils");
const { getUserDetails } = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("../../infrastructure/organisations");
const { getAllServices } = require("../../infrastructure/applications");
const logger = require("../../infrastructure/logger");

const getOrganisations = async (userId, correlationId) => {
  const orgServiceMapping = userId.startsWith("inv-")
    ? await getInvitationOrganisations(userId.substr(4), correlationId)
    : await getUserOrganisations(userId, correlationId);
  if (!orgServiceMapping) {
    return [];
  }

  const organisations = await Promise.all(
    orgServiceMapping.map(async (invitation) => {
      const services = await Promise.all(
        invitation.services.map(async (service) => {
          return {
            id: service.id,
            name: service.name,
            userType: invitation.role,
            grantedAccessOn: service.requestDate
              ? new Date(service.requestDate)
              : null,
            formattedRequestDate: service.requestDate
              ? dateFormat(service.requestDate, "shortDateFormat")
              : "",
            lastLogin: null,
            token: null,
          };
        }),
      );

      return {
        id: invitation.organisation.id,
        name: invitation.organisation.name,
        urn: invitation.organisation.urn,
        uid: invitation.organisation.uid,
        upin: invitation.organisation.upin,
        ukprn: invitation.organisation.ukprn,
        status: invitation.organisation.status,
        services,
      };
    }),
  );

  return organisations;
};

const action = async (req, res) => {
  const user = await getUserDetails(req);
  const showChangeEmail = !isInternalEntraUser(user);
  user.formattedLastLogin = user.lastLogin
    ? dateFormat(user.lastLogin, "longDateFormat")
    : "";
  const organisationDetails = await getOrganisations(user.id, req.id);
  const allServices = await getAllServices();
  const externalServices = allServices.services.filter(
    (x) =>
      x.isExternalService === true &&
      !(
        x.relyingParty &&
        x.relyingParty.params &&
        x.relyingParty.params.hideSupport === "true"
      ),
  );

  const allOrganisationsForUser = [];
  for (let i = 0; i < organisationDetails.length; i++) {
    const org = Object.assign(Object.assign({}, organisationDetails[i]), {
      services: [],
      naturalIdentifiers: [],
    });
    org.naturalIdentifiers = [];
    const { urn } = org;
    const { uid } = org;
    const { upin } = org;
    const { ukprn } = org;
    if (urn) {
      org.naturalIdentifiers.push(`URN: ${urn}`);
    }
    if (uid) {
      org.naturalIdentifiers.push(`UID: ${uid}`);
    }
    if (upin) {
      org.naturalIdentifiers.push(`UPIN: ${upin}`);
    }
    if (ukprn) {
      org.naturalIdentifiers.push(`UKPRN: ${ukprn}`);
    }

    for (let j = 0; j < organisationDetails[i].services.length; j++) {
      const svc = Object.assign({}, organisationDetails[i].services[j]);
      const isExternalService = externalServices.find((x) => x.id === svc.id);
      if (isExternalService) {
        org.services.push(svc);
      }
    }

    // Sort services alphabetically
    org.services.sort((a, b) => a.name.localeCompare(b.name));
    allOrganisationsForUser.push(org);
  }
  req.session.type = "services";
  req.session.user = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) viewed user ${user.email} (id: ${user.id})`,
    {
      type: "support",
      subType: "user-view",
      userId: req.user.sub,
      userEmail: req.user.email,
      viewedUser: user.id,
    },
  );

  sendResult(req, res, "users/views/services", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    backLink: true,
    user,
    showChangeEmail,
    organisations: allOrganisationsForUser,
    isInvitation: req.params.uid.startsWith("inv-"),
  });
};

module.exports = action;
