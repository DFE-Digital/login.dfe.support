const { NotificationClient } = require("login.dfe.jobs-client");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const accessRequests = require("../../infrastructure/accessRequests");
const { emailPolicy } = require("login.dfe.validation");
const {
  getUserRaw,
  addOrganisationToUser,
  getUserOrganisationRequestRaw,
  getPendingRequestsRaw,
  getUserServiceRequestsRaw,
} = require("login.dfe.api-client/users");
const {
  getOrganisationRaw,
  getOrganisationRequestsRaw,
  getServiceRequestRaw,
} = require("login.dfe.api-client/organisations");
const { getServiceRaw } = require("login.dfe.api-client/services");

const unpackMultiSelect = (parameter) => {
  if (!parameter) {
    return [];
  }
  if (!(parameter instanceof Array)) {
    return [parameter];
  }
  return parameter;
};

const serviceRequestStatusNames = {
  [-1]: "Rejected",
  0: "Pending",
  1: "Approved",
  2: "Overdue",
  3: "No Approvers",
};

const serviceRequestTypeNames = {
  service: "Service access",
  subService: "Sub-service access",
};

const normalizeServiceRequests = async (serviceRequests) => {
  if (serviceRequests.length === 0) return [];
  const uniqueOrgIds = [
    ...new Set(serviceRequests.map((r) => r.organisationId)),
  ];
  const orgEntries = await Promise.all(
    uniqueOrgIds.map(async (orgId) => {
      const org = await getOrganisationRaw({ by: { organisationId: orgId } });
      return [orgId, org ? org.name : ""];
    }),
  );
  const orgNameMap = Object.fromEntries(orgEntries);
  return serviceRequests.map((r) => ({
    id: r.id,
    user_id: r.userId,
    org_id: r.organisationId,
    org_name: orgNameMap[r.organisationId] || "",
    created_date: r.createdAt,
    status: {
      id: r.status,
      name: serviceRequestStatusNames[r.status] || "Unknown",
    },
    request_type: {
      id: r.requestType,
      name: serviceRequestTypeNames[r.requestType] || r.requestType,
    },
  }));
};

const resolveEmailToUserId = async (email) => {
  if (
    !emailPolicy.doesEmailMeetPolicy(email) ||
    email.includes("/") ||
    email.includes("..")
  ) {
    return null;
  }
  const user = await getUserRaw({ by: { email } });
  return user ? user.sub : null;
};

const search = async (req) => {
  const paramsSource = req.method === "POST" ? req.body : req.query;

  let page = paramsSource.page ? parseInt(paramsSource.page, 10) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const filterStatus = unpackMultiSelect(paramsSource.status);
  const filterType = unpackMultiSelect(paramsSource.requestType);
  const searchEmail = paramsSource.searchEmail
    ? paramsSource.searchEmail.trim()
    : "";

  if (searchEmail) {
    const userId = await resolveEmailToUserId(searchEmail);
    if (!userId) {
      return {
        page: 1,
        numberOfPages: 0,
        totalNumberOfResults: 0,
        accessRequests: [],
        noUserFound: true,
        searchEmail,
      };
    }

    const [rawOrgRequests, rawServiceRequests] = await Promise.all([
      getPendingRequestsRaw({ userId }),
      getUserServiceRequestsRaw({ userId }),
    ]);

    const orgRequests = (rawOrgRequests || []).map((r) => ({
      ...r,
      request_type: { id: "organisation", name: "Organisation access" },
    }));

    const serviceRequests = await normalizeServiceRequests(
      rawServiceRequests || [],
    );

    let requests = [...orgRequests, ...serviceRequests];

    if (filterType.length > 0) {
      requests = requests.filter((r) => filterType.includes(r.request_type.id));
    }
    if (filterStatus.length > 0) {
      requests = requests.filter((r) =>
        filterStatus.includes(String(r.status.id)),
      );
    }

    return {
      page: 1,
      numberOfPages: requests.length > 0 ? 1 : 0,
      totalNumberOfResults: requests.length,
      accessRequests: requests,
      searchEmail,
    };
  }

  const results = await getOrganisationRequestsRaw({
    pageNumber: page,
    filterStatus,
    filterType,
  });

  return {
    page,
    numberOfPages: results.totalNumberOfPages,
    totalNumberOfResults: results.totalNumberOfRecords,
    accessRequests: results.requests,
    searchEmail,
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
  const approved = req.body.approve_reject.toLowerCase() === "approve";
  let role = 0;
  let reason = req.body.message;

  if (approved) {
    reason = "";
    role = req.body.role.toLowerCase() === "approver" ? 10000 : 1;
  }

  await addOrganisationToUser({
    userId,
    organisationId: orgId,
    roleId: role,
    reason,
  });

  if (req.body.email) {
    await notificationClient.sendAccessRequest(
      req.body.email,
      req.body.name,
      req.body.org_name,
      approved,
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
  const request = await getUserOrganisationRequestRaw({
    by: { userOrganisationRequestId: req.params.rid },
  });
  const organisation = await getOrganisationRaw({
    by: { organisationId: request.org_id },
  });
  const user = await getUserRaw({ by: { id: request.user_id } });

  let mappedRequest;
  if (request) {
    const approver =
      request.actioned_by != null
        ? await getUserRaw({ by: { id: request.actioned_by } })
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

const getAndMapServiceRequest = async (req) => {
  const request = await getServiceRequestRaw({
    serviceRequestId: req.params.rid,
  });

  if (!request) {
    return null;
  }

  const [user, service] = await Promise.all([
    getUserRaw({ by: { id: request.user_id } }),
    getServiceRaw({ by: { serviceId: request.service_id } }),
  ]);

  return Object.assign(
    {
      usersName: user ? `${user.given_name} ${user.family_name}` : "",
      usersEmail: user ? user.email : "",
      serviceName: service ? service.name : "",
    },
    request,
  );
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

const requestTypeMap = [
  { id: "organisation", name: "Organisation" },
  { id: "service", name: "Service" },
  { id: "subService", name: "Sub-service" },
];

module.exports = {
  search,
  getById,
  putUserInOrganisation,
  getAndMapOrgRequest,
  getAndMapServiceRequest,
  mapStatusForSupport,
  unpackMultiSelect,
  userStatusMap,
  requestTypeMap,
};
