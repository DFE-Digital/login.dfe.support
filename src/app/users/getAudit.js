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
const { getServiceById } = require("./../../infrastructure/applications");
const { getUserStatus } = require("../../infrastructure/directories");
const {
  getOrganisationById,
  getUserOrganisations,
} = require("./../../infrastructure/organisations");

let cachedServiceIds = {};
let cachedServices = {};
let cachedUsers = {};

const getCachedUserById = async (userId, reqId) => {
  let key = `${userId}:${reqId}`;
  if (!(key in cachedUsers)) {
    const user = await getUserDetailsById(userId, reqId);
    cachedUsers[key] = user;
  }
  return cachedUsers[key];
};

const describeAuditEvent = async (audit, req) => {
  const isCurrentUser =
    audit.userId.toLowerCase() === req.params.uid.toLowerCase();

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

  if (
    audit.subType === "user-service-deleted" ||
    audit.subType === "user-services-added" ||
    audit.subType === "user-service-updated" ||
    audit.subType === "org-edit"
  ) {
    return audit.message;
  }

  if (audit.type === "support" && audit.subType === "user-edit") {
    const viewedUser = audit.editedUser
      ? await getCachedUserById(audit.editedUser, req.id)
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

  if (audit.type === "support" && audit.subType === "user-view") {
    const viewedUser = audit.viewedUser
      ? await getCachedUserById(audit.viewedUser, req.id)
      : "";
    return `Viewed user ${viewedUser.firstName} ${viewedUser.lastName}`;
  }

  if (audit.type === "support" && audit.subType === "user-search") {
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
    return "User invite sent from support console.";
  }

  if (audit.subType === "invite-created") {
    switch (audit.type) {
      case "approver":
        return "Services/Invitation code created and sent.";
      case "support":
        return "Support/Invitation code created and sent.";
      default:
        break;
    }

    return audit.type;
  }

  if (audit.type === "approver" && audit.subType === "user-invited") {
    return "User invite sent from Manage users (Services console).";
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
    const organisation = await getOrganisationById(
      organisationId.oldValue,
      req.id,
    );
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Deleted organisation: ${organisation.name} for user  ${viewedUser.firstName} ${viewedUser.lastName} legacyID: (
      numericIdentifier: ${audit["numericIdentifier"]}, textIdentifier: ${audit["textIdentifier"]})`;
  }
  if (audit.type === "support" && audit.subType === "user-org") {
    const organisationId =
      audit.editedFields &&
      audit.editedFields.find((x) => x.name === "new_organisation");
    const organisation = await getOrganisationById(organisationId.newValue);
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Added organisation: ${organisation.name} for user ${viewedUser.firstName} ${viewedUser.lastName}`;
  }
  if (
    audit.type === "support" &&
    audit.subType === "user-org-permission-edited"
  ) {
    const editedFields =
      audit.editedFields &&
      audit.editedFields.find((x) => x.name === "edited_permission");
    const viewedUser = await getCachedUserById(audit.editedUser, req.id);
    return `Edited permission level to ${editedFields.newValue} for user ${viewedUser.firstName} ${viewedUser.lastName} in organisation ${editedFields.organisation}`;
  }
  if (audit.type === "approver" && audit.subType === "user-org-deleted") {
    try {
      const metaData = audit?.meta ? JSON.parse(audit.meta) : audit;
      const organisationId =
        metaData.editedFields &&
        metaData.editedFields.find((x) => x.name === "new_organisation");
      const organisation = await getOrganisationById(
        organisationId.oldValue,
        req.id,
      );
      // Escaping audit.editedUser double quotes bug
      audit.editedUser = /["]/.test(audit.editedUser)
        ? audit.editedUser.replace(/[""]+/g, "")
        : audit.editedUser;
      const viewedUser = await getCachedUserById(audit.editedUser, req.id);
      return `Deleted organisation: ${organisation.name} for user  ${viewedUser.firstName} ${viewedUser.lastName} legacyID: (
        numericIdentifier: ${audit["numericIdentifier"]}, textIdentifier: ${audit["textIdentifier"]})`;
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
    const service = await getServiceById(serviceId);
    cachedServices[key] = service;
  }
  return cachedServices[key];
};

const getAudit = async (req, res) => {
  cachedServiceIds = {};
  cachedServices = {};
  cachedUsers = {};
  const correlationId = req.id;
  const user = await getCachedUserById(req.params.uid, req.id);
  const showChangeEmail = !isInternalEntraUser(user);
  user.formattedLastLogin = user.lastLogin
    ? dateFormat(user.lastLogin, "longDateFormat")
    : "";
  if (user.status.id === 0) {
    const userStatus = await getUserStatus(user.id);
    user.statusChangeReasons = userStatus ? userStatus.statusChangeReasons : [];
  }
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);
  req.session.type = "audit";
  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber)) {
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
    }
    if (audit.organisationId) {
      organisation = await getOrganisationById(audit.organisationId);
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
          : await getCachedUserById(audit.userId.toUpperCase(), req.id),
    });
  }

  sendResult(req, res, "users/views/audit", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    backLink:
      req.session?.params?.searchType === "organisations"
        ? "/organisations"
        : "/users",
    user,
    showChangeEmail,
    organisations: userOrganisations,
    audits,
    numberOfPages: pageOfAudits.numberOfPages,
    page: pageNumber,
    totalNumberOfResults: pageOfAudits.numberOfRecords,
  });
};

module.exports = getAudit;
