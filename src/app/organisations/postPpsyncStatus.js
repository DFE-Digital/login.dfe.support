const { organisation } = require("login.dfe.dao");
const { ServiceBusClient } = require("@azure/service-bus");
const logger = require("../../infrastructure/logger");
const { sendResult } = require("../../infrastructure/utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");

const validateInput = async (req) => {
  const model = {
    emailStatus: req.body.emailStatus || "",
    validationMessages: {},
  };

  if (!model.emailStatus) {
    model.validationMessages.emailStatus =
      "Confirm you have received the Provider Profile email";
  }
  return model;
};

async function sendServiceMessage() {
  try {
    logger.debug("3 ------ Sending Service message starts ---------");
    const sbClient = new ServiceBusClient(process.env.SB_CONNECTION_STRING);
    const sender = sbClient.createSender(process.env.SB_TOPIC_NAME);
    const message = { body: "SUPPORT_TRIGGERED" };
    await sender.sendMessages(message);
    await sender.close();
    logger.debug("4 ------ Sending Service message ends ---------");
  } catch (ex) {
    logger.error("sendServiceMessage", { error: { ...ex } });
  }
}

const postPpsyncStatus = async (req, res) => {
  const model = await validateInput(req);
  const pageNumber =
    req.query && req.query.page ? parseInt(req.query.page, 10) : 1;

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.layout = "sharedViews/layoutNew.ejs";
    const ppauditData = await organisation.getPpAuditPaging(pageNumber);
    model.audits = ppauditData.audits.map((audit) => ({
      ...audit,
      formattedStartDate: audit.startDate
        ? dateFormat(audit.startDate, "longDateFormat")
        : "",
      formattedEndDate: audit.endDate
        ? dateFormat(audit.endDate, "longDateFormat")
        : "",
    }));
    model.numberOfPages = ppauditData.totalNumberOfPages;
    model.page = pageNumber;
    model.totalNumberOfResults = ppauditData.totalNumberOfRecords;
    return sendResult(req, res, "organisations/views/ppsyncStatus", model);
  }
  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) wsSync has been initiated by ${req.user.email} (id: ${req.user.sub})`,
    {
      type: "organisations",
      subType: "ppSync-started",
      userId: req.user.sub,
      userEmail: req.user.email,
    },
  );
  await sendServiceMessage();
  res.flash("info", "The Provider Profile Sync is in progress");
  return res.redirect("/organisations");
};

module.exports = postPpsyncStatus;
