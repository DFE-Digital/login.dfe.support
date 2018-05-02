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
  const invitationId = await createInvite(req.session.newUser.firstName, req.session.newUser.lastName, req.session.newUser.email,
    null, profilesOrigin.clientId, profilesOrigin.redirectUri, req.id);

  if (req.session.newUser.organisationId) {
    await addInvitationOrganisation(invitationId, req.session.newUser.organisationId, req.session.newUser.permission || 0, req.id);
  }

  logger.audit(`${req.user.email} (id: ${req.user.sub}) invited ${req.session.newUser.email}`,
    {
      type: 'support',
      subType: 'user-invite',
      userId: req.user.sub,
      userEmail: req.user.email,
      invitedUserEmail: req.session.newUser.email,
    });

  res.flash('info', `${req.session.newUser.firstName} ${req.session.newUser.lastName} has been invited`);
  return res.redirect(`/users/inv-${invitationId}`);
};

module.exports = postConfirmNewUser;
