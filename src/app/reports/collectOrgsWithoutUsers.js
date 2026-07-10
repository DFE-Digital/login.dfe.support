const { getApiClient, ApiName } = require("login.dfe.api-client/api");
const logger = require("../../infrastructure/logger");

const get = async (req, res) => {
  const { correlationId } = req;
  let organisations = [];

  try {
    const organisationsClient = getApiClient(ApiName.Organisations);
    const result = await organisationsClient.get(
      "/organisations/collect-without-active-users",
      { additionalHeaders: { "x-correlation-id": correlationId } },
    );
    organisations = result ?? [];
  } catch (e) {
    logger.error(
      `Failed to load COLLECT orgs without active users report - ${e.message}`,
      { correlationId },
    );
  }

  return res.render("reports/views/collectOrgsWithoutUsers", {
    currentPage: "reports",
    title: "COLLECT: Organisations without active users",
    organisations,
  });
};

module.exports = { get };
