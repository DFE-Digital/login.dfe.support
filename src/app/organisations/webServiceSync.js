const { sendResult } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");

const { wsSyncCall } = require("./wsSynchFunCall");

const get = async (req, res) => {
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.id },
  });

  sendResult(req, res, "organisations/views/webServiceSync", {
    csrfToken: req.csrfToken(),
    organisation: organisation,
  });
};
const post = async (req, res) => {
  try {
    const result = await wsSyncCall(req.params.id);
    if (result === undefined) {
      res.flash("info", "Organisation was not found when performing sync");
      logger.info(`Sync returned 404 status for org [${req.params.id}].`);
    }
  } catch (e) {
    res.flash("error", "Something went wrong during web service sync");
    logger.error("Something went wrong during web service sync", e);
  }

  return res.redirect(`/organisations/${req.params.id}/users`);
};
module.exports = {
  get,
  post,
};
