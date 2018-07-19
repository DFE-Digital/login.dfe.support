const PublicApiClient = require('login.dfe.public-api.jobs.client');
const config = require('./../config');
const jobsClient = new PublicApiClient(config.notifications);

const queueCreateInvite = async (details) => {
  await jobsClient.sendInvitationRequest(details.given_name, details.family_name, details.email, details.organisationId,
    details.sourceId, details.callback, details.userRedirect, details.clientId);
  return details.sourceId
};

module.exports = {
  queueCreateInvite
};
