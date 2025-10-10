const { NotificationClient } = require("login.dfe.jobs-client");
const { getAndMapOrgRequest } = require("./utils");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const {
  updateRequestForOrganisationRaw,
} = require("login.dfe.api-client/organisations");

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

const get = async (req, res) => {
  return res.render("accessRequests/views/rejectOrganisationRequest", {
    csrfToken: req.csrfToken(),
    title: "Reason for rejection - DfE Sign-in",
    backLink: true,
    layout: "sharedViews/layout.ejs",
    cancelLink:
      req.params.from === "organisation"
        ? `/access-requests/${req.params.rid}/${req.params.from}/review`
        : `/access-requests/${req.params.rid}/review`,
    reason: "",
    validationMessages: {},
  });
};

const validate = async (req) => {
  const request = await getAndMapOrgRequest(req);
  const model = {
    title: "Reason for rejection - DfE Sign-in",
    layout: "sharedViews/layout.ejs",
    backLink: true,
    requestFrom: req.params.from,
    cancelLink:
      req.params.from === "organisation"
        ? `/access-requests/${req.params.rid}/${req.params.from}/review`
        : `/access-requests/${req.params.rid}/review`,
    reason: req.body.reason,
    request,
    validationMessages: {},
  };
  if (model.reason.length > 1000) {
    model.validationMessages.reason =
      "Reason cannot be longer than 1000 characters";
  } else if (model.request.approverEmail) {
    model.validationMessages.reason = `Request already actioned by ${model.request.approverEmail}`;
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("accessRequests/views/rejectOrganisationRequest", model);
  }
  // patch request with rejection
  await updateRequestForOrganisationRaw({
    requestId: model.request.id,
    status: -1,
    actionedByUserId: req.user.sub,
    actionedAt: Date.now(),
    reason: model.reason,
  });

  //send rejected email
  await notificationClient.sendAccessRequest(
    model.request.usersEmail,
    model.request.usersName,
    model.request.org_name,
    false,
    model.reason,
  );

  //audit organisation rejected
  logger.audit(`${req.user.email} rejected organisation request`, {
    type: "approver",
    subType: "rejected-org",
    userId: req.user.sub,
    organisationId: model.request.org_id,
    editedUser: model.request.user_id,
    reason: model.reason,
  });

  res.flash(
    "rejected",
    `Request rejected - an email has been sent to ${model.request.usersEmail}.`,
  );
  if (model.requestFrom && model.requestFrom === "organisation")
    return res.redirect(`/users/${model.request.user_id}/organisations`);
  else return res.redirect("/access-requests");
};

module.exports = {
  get,
  post,
};
