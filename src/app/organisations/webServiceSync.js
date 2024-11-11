const { sendResult } = require('../../infrastructure/utils');
const { getOrganisationByIdV2 } = require('../../infrastructure/organisations');
const { wsSyncCall } = require('./wsSynchFunCall');

const get = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);

  sendResult(req, res, 'organisations/views/webServiceSync', {
    csrfToken: req.csrfToken(),
    organisation: organisation,
  });
};
const post = async (req, res) => {
  await wsSyncCall(req.params.id);
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  return res.redirect(`/organisations/${organisation.id}/users`);
};
module.exports = {
  get,
  post,
};
