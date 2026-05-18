const { NotificationClient } = require("login.dfe.jobs-client");
const { getAndMapServiceRequest } = require("./utils");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const { updateServiceRequest } = require("login.dfe.api-client/services");

const get = async (req, res) => {
  return res.render("accessRequests/views/rejectServiceRequest", {
    csrfToken: req.csrfToken(),
    title: "Reason for rejection - DfE Sign-in",
    backLink: true,
    layout: "sharedViews/layout.ejs",
    cancelLink: `/access-requests/${req.params.rid}/service-request/review`,
    reason: "",
    validationMessages: {},
  });
};

const validate = async (req) => {
  const request = await getAndMapServiceRequest(req);
  const model = {
    title: "Reason for rejection - DfE Sign-in",
    layout: "sharedViews/layout.ejs",
    backLink: true,
    cancelLink: `/access-requests/${req.params.rid}/service-request/review`,
    reason: req.body.reason,
    request,
    validationMessages: {},
  };
  if (model.reason.length > 1000) {
    model.validationMessages.reason =
      "Reason cannot be longer than 1000 characters";
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("accessRequests/views/rejectServiceRequest", model);
  }

  await updateServiceRequest({
    serviceRequestId: model.request.id,
    status: -1,
    actionedByUserId: req.user.sub,
    actionedAt: new Date(),
    reason: model.reason,
  });

  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });
  await notificationClient.sendAccessRequest(
    model.request.usersEmail,
    model.request.usersName,
    model.request.org_name,
    false,
    model.reason,
  );

  logger.audit(
    `${req.user.email} rejected service request for ${model.request.usersEmail}`,
    {
      type: "approver",
      subType: "service-request-rejected",
      userId: req.user.sub,
      serviceId: model.request.service_id,
      editedUser: model.request.user_id,
      reason: model.reason,
    },
  );

  res.flash(
    "rejected",
    `Request rejected - an email has been sent to ${model.request.usersEmail}.`,
  );
  return res.redirect("/access-requests");
};

module.exports = { get, post };
