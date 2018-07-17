const PublicApiClient = require('login.dfe.public-api.jobs.client');

const jobsClient = new PublicApiClient(config.notifications);

const queueCreateInvite = async (details) => {
  await jobsClient.sendInvitationRequest(details.given_name, details.family_name, details.email, details.organisationId,
    details.sourceId, details.callback, details.userRedirect, details.clientId)
};

const createInvite = async (req,res) => {
  await queueCreateInvite(req.body);
  return res.status(200).send();
};

module.exports = createInvite;
