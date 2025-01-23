const { sendResult, mapUserStatus } = require("./../../infrastructure/utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");

const { organisation } = require("login.dfe.dao");

const getppsyncStatus = async (req, res) => {
  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;

  const ppauditData = await organisation.getPpAuditPaging(pageNumber);
  ppauditData.audits = ppauditData.audits.map((audit) => ({
    ...audit,
    formattedStartDate: audit.startDate
      ? dateFormat(audit.startDate, "longDateFormat")
      : "",
    formattedEndDate: audit.endDate
      ? dateFormat(audit.endDate, "longDateFormat")
      : "",
  }));

  const activeSync = ppauditData.audits.filter(
    (f) => f.statusStep1 === 1 && f.endDate === null,
  );
  if (activeSync && activeSync.length > 0) {
    req.syncInP = true;
  }
  sendResult(req, res, "organisations/views/ppsyncStatus", {
    csrfToken: req.csrfToken(),
    audits: ppauditData.audits,
    syncInP: req.syncInP,
    cancelLink: "/organisations",
    validationMessages: {},
    numberOfPages: ppauditData.totalNumberOfPages,
    page: pageNumber,
    totalNumberOfResults: ppauditData.totalNumberOfRecords,
  });
};

module.exports = getppsyncStatus;
