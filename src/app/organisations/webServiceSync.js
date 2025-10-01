const { sendResult } = require("../../infrastructure/utils");
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
  await wsSyncCall(req.params.id);
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.id },
  });
  return res.redirect(`/organisations/${organisation.id}/users`);
};
module.exports = {
  get,
  post,
};
