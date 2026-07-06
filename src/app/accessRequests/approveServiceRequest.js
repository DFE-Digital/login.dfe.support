const { NotificationClient } = require("login.dfe.jobs-client");
const { getAndMapServiceRequest } = require("./utils");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const { updateServiceRequest } = require("login.dfe.api-client/services");
const { addServiceToUser } = require("login.dfe.api-client/users");

const get = async (req, res) => {
  const request = await getAndMapServiceRequest(req);
  if (!request) {
    return res.status(404).render("errors/notFound");
  }
  return res.render("accessRequests/views/approveServiceRequest", {
    csrfToken: req.csrfToken(),
    title: "Confirm approval - DfE Sign-in",
    backLink: true,
    layout: "sharedViews/layout.ejs",
    cancelLink: `/access-requests/${req.params.rid}/service-request/review`,
    request,
  });
};

const post = async (req, res) => {
  const request = await getAndMapServiceRequest(req);
  if (!request) {
    return res.status(404).render("errors/notFound");
  }

  const roleIds = request.role_ids
    ? request.role_ids
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  await addServiceToUser({
    userId: request.user_id,
    serviceId: request.service_id,
    organisationId: request.org_id,
    serviceRoleIds: roleIds,
  });

  await updateServiceRequest({
    serviceRequestId: request.id,
    status: 1,
    actionedByUserId: req.user.sub,
    actionedAt: new Date(),
    reason: "",
  });

  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });
  await notificationClient.sendAccessRequest(
    request.usersEmail,
    request.usersName,
    request.org_name,
    true,
    null,
  );

  logger.audit(
    `${req.user.email} approved service request for ${request.usersEmail}`,
    {
      type: "approver",
      subType: "service-request-approved",
      userId: req.user.sub,
      serviceId: request.service_id,
      editedUser: request.user_id,
    },
  );

  res.flash(
    "info",
    `Request approved - an email has been sent to ${request.usersEmail}.`,
  );
  return res.redirect("/access-requests");
};

module.exports = { get, post };
