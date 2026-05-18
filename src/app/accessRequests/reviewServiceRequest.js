const { getAndMapServiceRequest } = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");

const get = async (req, res) => {
  const request = await getAndMapServiceRequest(req);
  if (!request) {
    return res.status(404).render("errors/notFound");
  }
  request.formattedCreatedDate = request.created_date
    ? dateFormat(request.created_date, "longDateFormat")
    : "";

  return res.render("accessRequests/views/reviewServiceRequest", {
    csrfToken: req.csrfToken(),
    title: "Review request - DfE Sign-in",
    layout: "sharedViews/layout.ejs",
    backLink: true,
    cancelLink: "/access-requests",
    request,
    selectedResponse: null,
    validationMessages: {},
  });
};

const validate = async (req) => {
  const request = await getAndMapServiceRequest(req);
  request.formattedCreatedDate = request.created_date
    ? dateFormat(request.created_date, "longDateFormat")
    : "";
  const model = {
    title: "Review request - DfE Sign-in",
    layout: "sharedViews/layout.ejs",
    backLink: true,
    cancelLink: "/access-requests",
    request,
    selectedResponse: req.body.selectedResponse,
    validationMessages: {},
  };
  if (!model.selectedResponse) {
    model.validationMessages.selectedResponse =
      "Approve or Reject must be selected";
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("accessRequests/views/reviewServiceRequest", model);
  }

  if (model.selectedResponse === "reject") {
    return res.redirect("service-request/reject");
  } else if (model.selectedResponse === "approve") {
    return res.redirect("service-request/approve");
  }
};

module.exports = { get, post };
