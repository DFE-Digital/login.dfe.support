const {
  sendResult,
  mapUserStatus,
  isInternalEntraUser,
} = require("./../../infrastructure/utils");
const { getUserDetailsById } = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const { getPageOfUserAudits } = require("./../../infrastructure/audit");
const logger = require("./../../infrastructure/logger");
const {
  getServiceIdForClientId,
} = require("./../../infrastructure/serviceMapping");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  getUserOrganisationsWithServicesRaw,
  getUserStatusRaw,
} = require("login.dfe.api-client/users");
const {
  getOrganisationLegacyRaw,
} = require("login.dfe.api-client/organisations");
const {
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");

let cachedServiceIds = {};
let cachedServices = {};
let cachedUsers = {};

const INVITE_SUBTYPES = new Set(["invite-created", "user-invited"]);

const getCachedUserById = async (userId, req) => {
  let key = `${userId}:${req.id}`;
  if (!(key in cachedUsers)) {
    const user = await getUserDetailsById(userId, req);
    cachedUsers[key] = user;
  }
  return cachedUsers[key];
};

const describeAuditEvent = async (audit, req) => {
  const isCurrentUser =
    audit.userId.toLowerCase() === req.params.uid.toLowerCase();

  // Resolve the SUBJECT user's email for display (the invited/edited user, never
  // the acting agent). New audit records carry the email in metadata, so this
  // returns immediately without a lookup; only historical records written before
  // the email was denormalised fall back to an id-based lookup by editedUser —
  // the same pattern the user-org handlers below already use. The acting agent's
  // email always comes straight from audit.userEmail, consistent with the
  // existing user-org-permission-edited handler.
  const resolveSubjectEmail = async (metaEmail, editedUser) =>
    metaEmail ||
    (editedUser
      ? (await getCachedUserById(editedUser, req))?.email
      : undefined);

  if (audit.type === "sign-in") {
    let description = "Sign-in";
    switch (audit.subType) {
      case "username-password":
        description += " using email address and password";
        break;
    }
    return description;
  }

  if (audit.type === "Sign-out") {
    return audit.type;
  }

  const AUDIT_MESSAGE_SUBTYPES = new Set([
    "service-request-approved",
    "sub-service-request-approved",
    "organisation-request-approved",
    "service-request-rejected",
    "sub-service-request-rejected",
    "organisation-request-rejected",
    "service-info-edit",
    "user-service-deleted",
    "user-service-added",
    "user-services-added",
    "user-service-updated",
    "org-edit",
    "rejected-org",
    "user-editemail",
    "user-view",
    "access-request",
    "service-create",
    "service-config-updated",
    "policy-created",
    "policy-condition-added",
    "policy-role-added",
    "policy-removed",
    "policy-condition-removed",
    "policy-role-removed",
  ]);

  // The default SHOULD be audit.message, until the work is done to make this happen
  // any new audit subTypes should be added to this to make the switch easier.
  if (AUDIT_MESSAGE_SUBTYPES.has(audit.subType)) {
    return audit.message;
  }

  if (audit.type === "support" && audit.subType === "user-edit") {
    const viewedUser = audit.editedUser
      ? await getCachedUserById(audit.editedUser, req)
      : "";
    const editedStatusTo =
      audit.editedFields && audit.editedFields.find((x) => x.name === "status");
    if (editedStatusTo && editedStatusTo.newValue === 0) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      const reason = audit.reason ? audit.reason : "no reason given";
      return isCurrentUser
        ? `${newStatus.description} user: ${viewedUser.firstName} ${viewedUser.lastName} (reason: ${reason})`
        : ` Account ${newStatus.description} (reason: ${reason})`;
    }
    if (editedStatusTo && editedStatusTo.newValue === 1) {
      return isCurrentUser
        ? `Reactivated user: ${viewedUser.firstName} ${viewedUser.lastName}`
        : `Account Reactivated`;
    }
    if (editedStatusTo) {
      const newStatus = mapUserStatus(editedStatusTo.newValue);
      return newStatus.description;
    }
    return "Edited user";
  }

  if (audit.subType === "user-search") {
    return `Searched for users using criteria "${audit.criteria}"`;
  }

  if (audit.type === "change-email" && audit.success) {
    return "Changed email";
  }

  if (audit.type === "change-password") {
    switch (audit.subType) {
      case "incorrect-password":
        return "Incorrect current password";
      case "password-validation":
        return "Password validation failed";
      default:
        break;
    }

    return "Password changed";
  }

  if (audit.type === "support" && audit.subType === "user-invited") {
    const orgPart = audit.organisationName
      ? ` to ${audit.organisationName}`
      : "";
    return `${audit.userEmail} invited ${audit.invitedUserEmail}${orgPart} from support console`;
  }

  if (audit.type === "approver" && audit.subType === "user-invited") {
    const invitedEmail = await resolveSubjectEmail(
      audit.invitedUserEmail,
      audit.invitedUser,
    );
    if (audit.userEmail && invitedEmail) {
      return `${audit.userEmail} invited ${invitedEmail}`;
    }
    return audit.message;
  }

  if (
    audit.type === "approver" &&
    audit.subType === "invite-created" &&
    audit.userEmail
  ) {
    const invitedEmail = await resolveSubjectEmail(
      audit.invitedUserEmail,
      audit.editedUser,
    );
    const orgPart = audit.organisationName
      ? ` to ${audit.organisationName}`
      : "";
    return `${audit.userEmail} invited ${invitedEmail}${orgPart}`;
  }

  // Historical invite-created records (no denormalised userEmail) fall back to
  // the stored message rather than rendering a blank agent.
  if (
    (audit.type === "support" || audit.type === "approver") &&
    audit.subType === "invite-created"
  ) {
    return audit.message;
  }

  if (audit.type === "support" && audit.subType === "user-invite-org") {
    const invitedEmail = await resolveSubjectEmail(
      audit.invitedUserEmail,
      audit.editedUser,
    );
    let orgName = audit.organisationName;
    if (!orgName && audit.invitedOrganisation) {
      orgName = (
        await getOrganisationLegacyRaw({
          organisationId: audit.invitedOrganisation,
        })
      )?.name;
    }
    const orgPart = orgName ? ` to ${orgName}` : "";
    return `${audit.userEmail} invited ${invitedEmail}${orgPart}`;
  }

  if (audit.subType === "resent-invitation") {
    const invitedEmail = await resolveSubjectEmail(
      audit.invitedUserEmail,
      audit.editedUser,
    );
    return `${audit.userEmail} resent invitation email to ${invitedEmail}`;
  }

  if (audit.type === "reset-password") {
    return "Reset password";
  }

  if (audit.type === "change-name") {
    return "Changed name";
  }

  if (audit.type === "support" && audit.subType === "user-org-deleted") {
    const organisationId =
      audit.editedFields &&
      audit.editedFields.find((x) => x.name === "new_organisation");
    const organisation = await getOrganisationLegacyRaw({
      organisationId: organisationId.oldValue,
    });
    const viewedUser = await getCachedUserById(audit.editedUser, req);
    const numericId = audit["numericIdentifier"];
    const textId = audit["textIdentifier"];
    const legacyPart =
      numericId && textId
        ? ` legacyID: (numericIdentifier: ${numericId}, textIdentifier: ${textId})`
        : "";
    return `Deleted organisation: ${organisation.name} for user ${viewedUser.firstName} ${viewedUser.lastName}${legacyPart}`;
  }
  if (audit.type === "support" && audit.subType === "user-org") {
    const organisationId =
      audit.editedFields &&
      audit.editedFields.find((x) => x.name === "new_organisation");
    const organisation = await getOrganisationLegacyRaw({
      organisationId: organisationId.newValue,
    });
    const viewedUser = await getCachedUserById(audit.editedUser, req);
    return `Added organisation: ${organisation.name} for user ${viewedUser.firstName} ${viewedUser.lastName}`;
  }
  if (
    audit.type === "support" &&
    audit.subType === "user-org-permission-edited"
  ) {
    const editedFields =
      audit.editedFields &&
      audit.editedFields.find((x) => x.name === "edited_permission");
    const viewedUser = await getCachedUserById(audit.editedUser, req);
    return `${audit.userEmail || "Support agent"} edited permission to ${editedFields.newValue} for ${viewedUser.email} in organisation ${editedFields.organisation || ""}`;
  }
  if (
    audit.type === "approver" &&
    audit.subType === "user-org-permission-edited"
  ) {
    const editedFields =
      audit.editedFields &&
      audit.editedFields.find((x) => x.name === "edited_permission");
    const editedEmail = await resolveSubjectEmail(
      audit.editedUserEmail,
      audit.editedUser,
    );
    const orgPart = audit.organisationName
      ? ` in ${audit.organisationName}`
      : "";
    return `${audit.userEmail} edited permission to ${editedFields?.newValue} for ${editedEmail}${orgPart}`;
  }
  if (audit.type === "approver" && audit.subType === "user-org-deleted") {
    try {
      const metaData = audit?.meta ? JSON.parse(audit.meta) : audit;
      const organisationId =
        metaData.editedFields &&
        metaData.editedFields.find((x) => x.name === "new_organisation");
      const orgId = organisationId?.oldValue ?? audit.organisationId;
      const organisation = await getOrganisationLegacyRaw({
        organisationId: orgId,
      });
      // Escaping audit.editedUser double quotes bug
      audit.editedUser = /["]/.test(audit.editedUser)
        ? audit.editedUser.replace(/[""]+/g, "")
        : audit.editedUser;
      const viewedUser = await getCachedUserById(audit.editedUser, req);
      const numericId = audit["numericIdentifier"];
      const textId = audit["textIdentifier"];
      const legacyPart =
        numericId && textId
          ? ` legacyID: (numericIdentifier: ${numericId}, textIdentifier: ${textId})`
          : "";
      return `Deleted organisation: ${organisation.name} for user ${viewedUser.firstName} ${viewedUser.lastName}${legacyPart}`;
    } catch {
      return audit.message;
    }
  }

  return `${audit.type} / ${audit.subType}`;
};

const getCachedServiceIdForClientId = async (client) => {
  if (!(client in cachedServiceIds)) {
    cachedServiceIds[client] = await getServiceIdForClientId(client);
  }
  return cachedServiceIds[client];
};

const getCachedServiceById = async (serviceId, reqId) => {
  let key = `${serviceId}:${reqId}`;
  if (!(key in cachedServices)) {
    const service = await getServiceRaw({ by: { serviceId } });
    cachedServices[key] = service;
  }
  return cachedServices[key];
};

const getAudit = async (req, res) => {
  cachedServiceIds = {};
  cachedServices = {};
  cachedUsers = {};
  const correlationId = req.id;
  const user = await getCachedUserById(req.params.uid, req);
  const showChangeEmail = !isInternalEntraUser(user);
  user.formattedLastLogin = user.lastLogin
    ? dateFormat(user.lastLogin, "longDateFormat")
    : "";
  if (user.status.id === 0) {
    const userStatus = await getUserStatusRaw({ userId: user.id });
    user.statusChangeReasons = userStatus ? userStatus.statusChangeReasons : [];
  }
  const userOrganisations =
    (req.params.uid.startsWith("inv-")
      ? await getInvitationOrganisationsRaw({
          invitationId: req.params.uid.substr(4),
        })
      : await getUserOrganisationsWithServicesRaw({
          userId: req.params.uid,
        })) ?? [];
  req.session.type = "audit";
  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).send();
  }
  const pageOfAudits = await getPageOfUserAudits(user.id, pageNumber);
  const audits = [];

  for (let i = 0; i < pageOfAudits.audits.length; i++) {
    const audit = pageOfAudits.audits[i];
    let service = null;
    let organisation = null;
    let clientId = audit.client;
    if (!clientId) {
      // try and extract client id from the message as we don't always have metadata available
      const regex = /Authenticated .*? for (.+)/i;
      const match = regex.exec(audit.message);
      if (match !== null && match.length === 2) {
        clientId = match[1];
      }
    }
    if (clientId) {
      // remove double quotes as new audit logger is adding them to string values
      clientId = clientId.replace(/"/g, "");

      const serviceId = await getCachedServiceIdForClientId(clientId);
      if (serviceId) {
        service = await getCachedServiceById(serviceId, req.id);
      } else {
        logger.info(
          `User audit tab - No service mapping for client ${clientId} using client id`,
          { correlationId },
        );
        service = { name: clientId };
      }
    } else {
      // If clientId isn't found, we'll try and see if the serviceId is part of the metadata
      const serviceId = audit.serviceId;
      if (serviceId) {
        service = await getCachedServiceById(serviceId, req.id);
      }
    }
    if (audit.organisationId) {
      organisation = await getOrganisationLegacyRaw({
        organisationId: audit.organisationId,
      });
    }

    audits.push({
      timestamp: new Date(audit.timestamp),
      formattedTimestamp: audit.timestamp
        ? dateFormat(audit.timestamp, "longDateFormat")
        : "",
      event: {
        type: audit.type,
        subType: audit.subType,
        description: await describeAuditEvent(audit, req),
      },
      service,
      organisation,
      result: audit.success === undefined ? true : audit.success,
      user:
        audit.userId.toLowerCase() === user.id.toLowerCase()
          ? user
          : await getCachedUserById(audit.userId.toUpperCase(), req),
    });
  }

  const isInvitation = req.params.uid.startsWith("inv-");
  const hasInviteEvent = audits.some((a) =>
    INVITE_SUBTYPES.has(a.event.subType),
  );
  // Only add fallback on single-page results — multi-page users are assumed to
  // have a real invite event on a later page that hasn't loaded yet.
  let totalNumberOfResults = pageOfAudits.numberOfRecords;
  if (
    isInvitation &&
    pageNumber === 1 &&
    !hasInviteEvent &&
    pageOfAudits.numberOfPages <= 1 &&
    user.createdAt
  ) {
    audits.push({
      timestamp: new Date(user.createdAt),
      formattedTimestamp: dateFormat(user.createdAt, "longDateFormat"),
      event: {
        type: "invitation-code",
        subType: "post-invitation",
        description: "Invitation created",
      },
      service: null,
      organisation: null,
      result: true,
      user: { name: "" },
    });
    totalNumberOfResults += 1;
  }

  sendResult(req, res, "users/views/audit", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    backLink:
      req.session?.params?.searchType === "organisations"
        ? "/organisations"
        : "/users",
    currentPage: "users",
    user,
    showChangeEmail,
    organisations: userOrganisations,
    audits,
    numberOfPages: pageOfAudits.numberOfPages,
    page: pageNumber,
    totalNumberOfResults,
    isInvitation: req.params.uid.startsWith("inv-"),
  });
};

module.exports = getAudit;
