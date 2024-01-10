const config = require('./../../infrastructure/config');
const { sendResult } = require('./../../infrastructure/utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const {wsSyncCall}  = require('./wsSynchFunCall');

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
  //const serviceNotificationsClient = new ServiceNotificationsClient(config.notifications);
  //await serviceNotificationsClient.notifyOrganisationUpdated(organisation);
  //res.flash('info', 'Organisation has been queued for sync');
  return res.redirect(`/organisations/${organisation.id}/users`);
};
module.exports = {
  get,
  post,
};
