const { NotificationClient } = require("login.dfe.jobs-client");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const accessRequests = require("../../infrastructure/accessRequests");
const organisations = require("../../infrastructure/organisations");
const directories = require("../../infrastructure/directories");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { addOrganisationToUser } = require("login.dfe.api-client/users");

const unpackMultiSelect = (parameter) => {
  if (!parameter) {
    return [];
  }
  if (!(parameter instanceof Array)) {
    return [parameter];
  }
  return parameter;
};

const search = async (req) => {
  const paramsSource = req.method === "POST" ? req.body : req.query;

  let page = paramsSource.page ? parseInt(paramsSource.page, 10) : 1;
  if (isNaN(page)) {
    page = 1;
  }
  const filterStatus = unpackMultiSelect(paramsSource.status);

  const results = await organisations.listRequests(page, filterStatus, req.id);

  return {
    page,
    numberOfPages: results.totalNumberOfPages,
    totalNumberOfResults: results.totalNumberOfRecords,
    accessRequests: results.requests,
  };
};

const getById = async (req) => {
  const id = `${req.params.id}`;

  return await accessRequests.getById(id);
};

const putUserInOrganisation = async (req) => {
  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });

  const id = `${req.body.userOrgId}`;

  await accessRequests.deleteAccessRequest(id);

  const userId = req.body.user_id;
  const orgId = req.body.org_id;
  const status = req.body.approve_reject.toLowerCase() === "approve" ? 1 : -1;
  let role = 0;
  let reason = req.body.message;

  if (status === 1) {
    reason = "";
    role = req.body.role.toLowerCase() === "approver" ? 10000 : 1;
  }

  await addOrganisationToUser({
    userId,
    organisationId: orgId,
    roleId: role,
    status,
    reason,
  });

  if (req.body.email) {
    await notificationClient.sendAccessRequest(
      req.body.email,
      req.body.name,
      req.body.org_name,
      status === 1,
      reason,
    );
  }

  logger.audit(
    `User ${req.user.email} (id: ${req.user.sub}) has set set user id ${userId} to status "${req.body.approve_reject}"`,
    {
      type: "organisation",
      subType: "access-request-support",
      success: true,
      editedUser: userId,
      userId: req.user.sub,
      userEmail: req.user.email,
      role,
      reason,
      orgId,
      status: req.body.approve_reject,
    },
  );
};

const getAndMapOrgRequest = async (req) => {
  const request = await organisations.getRequestById(req.params.rid, req.id);
  const organisation = await getOrganisationRaw({
    by: { organisationId: request.org_id },
  });
  const user = await directories.getUser(request.user_id);
  let mappedRequest;
  if (request) {
    const approver =
      request.actioned_by != null
        ? await directories.getUser(request.actioned_by)
        : null;
    const usersName = user ? `${user.given_name} ${user.family_name}` : "";
    const usersEmail = user ? user.email : "";
    const approverName = approver
      ? `${approver.given_name} ${approver.family_name}`
      : "";
    const approverEmail = approver ? approver.email : "";
    const uniqueOrgId = organisation.urn
      ? "URN:" + organisation.urn
      : organisation.ukprn
        ? "UKPRN:" + organisation.ukprn
        : organisation.uid
          ? "UID:" + organisation.uid
          : organisation.upin
            ? "UPIN:" + organisation.upin
            : organisation.legacyId
              ? "Legacy Id:" + organisation.legacyId
              : organisation.establishmentNumber
                ? "Establishment Number:" + organisation.establishmentNumber
                : null;
    const _cancelLink = req.headers.referer;
    mappedRequest = Object.assign(
      {
        usersName,
        usersEmail,
        approverName,
        approverEmail,
        uniqueOrgId,
        _cancelLink,
      },
      request,
    );
  }
  return mappedRequest;
};

const mapStatusForSupport = (status) => {
  switch (status.id) {
    case 0:
      return { id: 0, name: "Awaiting approver action" };
    case 2:
      return { id: 2, name: `${status.name} - Escalated to support` };
    case 3:
      return { id: 3, name: `${status.name} - Escalated to support` };
    default:
      return status.name;
  }
};

const userStatusMap = [
  { id: 0, name: "Awaiting approver action" },
  { id: 2, name: "Overdue - Escalated to support" },
  { id: 3, name: "No Approvers - Escalated to support" },
];

module.exports = {
  search,
  getById,
  putUserInOrganisation,
  getAndMapOrgRequest,
  mapStatusForSupport,
  unpackMultiSelect,
  userStatusMap,
};
