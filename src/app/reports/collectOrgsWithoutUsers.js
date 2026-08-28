const { getApiClient, ApiName } = require("login.dfe.api-client/api");
const logger = require("../../infrastructure/logger");

const pageSize = 25;

const get = async (req, res) => {
  const correlationId = req.id;

  let pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber) || pageNumber < 1) {
    pageNumber = 1;
  }

  let organisations = [];
  let numberOfPages = 0;
  let totalNumberOfResults = 0;
  // Distinguishes "the report ran and found nothing" from "the report could
  // not be loaded". Both used to render as an empty table, so a backend
  // failure read as a clean bill of health - the opposite of the truth.
  let loadFailed = false;

  try {
    const organisationsClient = getApiClient(ApiName.Organisations);
    const result = await organisationsClient.get(
      `/organisations/collect-without-active-users?page=${pageNumber}&pageSize=${pageSize}`,
      { additionalHeaders: { "x-correlation-id": correlationId } },
    );
    organisations = result?.organisations ?? [];
    numberOfPages = result?.totalNumberOfPages ?? 0;
    totalNumberOfResults = result?.totalNumberOfRecords ?? 0;
  } catch (e) {
    loadFailed = true;
    logger.error(
      `Failed to load COLLECT orgs without active users report - ${e.message}`,
      { correlationId },
    );
  }

  return res.render("reports/views/collectOrgsWithoutUsers", {
    currentPage: "reports",
    title: "COLLECT: Organisations without active users",
    organisations,
    page: pageNumber,
    numberOfPages,
    totalNumberOfResults,
    loadFailed,
  });
};

module.exports = { get };
