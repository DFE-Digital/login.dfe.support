const { createInvite } = require('./../../infrastructure/directories');
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
  const invitationId = await createInvite(req.session.user.firstName, req.session.user.lastName, req.session.user.email,
    null, profilesOrigin.clientId, profilesOrigin.redirectUri, req.id);

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
