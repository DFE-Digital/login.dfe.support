const { queueCreateInvite } = require('./../../infrastructure/jobs/api');
const { addInvitationOrganisation } = require('./../../infrastructure/organisations');
const { getOidcClientById } = require('./../../infrastructure/hotConfig');
const logger = require('./../../infrastructure/logger');

const getProfilesOriginForInvite = async () => {
  const client = await getOidcClientById('profiles');
  const redirectUri = client.redirect_uris[0];
  return {
    clientId: 'profiles',
    redirectUri,
  };
};

const postConfirmNewUser = async (req, res) => {
  const profilesOrigin = await getProfilesOriginForInvite();
  let details = {
    sourceId: req.id || undefined,
    given_name: req.session.user.firstName|| undefined,
    family_name: req.session.user.lastName|| undefined,
    email: req.session.user.email|| undefined,
    organisationId: req.session.user.organisationId || undefined,
    callbackUrl: req.session.user.callbackUrl || undefined,
    userRedirect: profilesOrigin.redirectUri || undefined,
    clientId: profilesOrigin.clientId,
  };
  const invitationId = await queueCreateInvite(details);

  if (req.session.user.organisationId) {
    await addInvitationOrganisation(invitationId, req.session.user.organisationId, req.session.user.permission || 0, req.id);
  }

  logger.audit(`${req.user.email} (id: ${req.user.sub}) invited ${req.session.user.email}`,
    {
      type: 'support',
      subType: 'user-invite',
      userId: req.user.sub,
      userEmail: req.user.email,
      invitedUserEmail: req.session.user.email,
    });

  res.flash('info', `${req.session.user.firstName} ${req.session.user.lastName} has been invited`);
  return res.redirect(`/users/inv-${invitationId}`);
};

module.exports = postConfirmNewUser;
