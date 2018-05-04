const logger = require('./../../infrastructure/logger');
const { addInvitationOrganisation, setUserAccessToOrganisation } = require('./../../infrastructure/organisations');

const addOrganisationToInvitation = async (uid, req) => {
  const invitationId = uid.substr(4);
  const organisationId = req.session.user.organisationId;
  const organisationName = req.session.user.organisationName;
  const permissionId = req.session.user.permission;

  await addInvitationOrganisation(invitationId, organisationId, permissionId, req.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) added organisation ${organisationName} (id: ${organisationId}) to invitation for ${req.session.user.email} (id: ${invitationId})`, {
    type: 'support',
    subType: 'user-invite-org',
    userId: req.user.sub,
    userEmail: req.user.email,
    invitedUserEmail: req.session.user.email,
    invitedOrganisation: organisationId,
  });
};
const addOrganisationToUser = async (uid, req) => {
  const organisationId = req.session.user.organisationId;
  const organisationName = req.session.user.organisationName;
  const permissionId = req.session.user.permission;

  await setUserAccessToOrganisation(uid, organisationId, permissionId, req.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) added organisation ${organisationName} (id: ${organisationId}) to user for ${req.session.user.email} (id: ${uid})`, {
    type: 'support',
    subType: 'user-org',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: uid,
    editedFields: [{
      name: 'new_organisation',
      oldValue: undefined,
      newValue: organisationId,
    }],
  });
};

const getConfirmAssociateOrganisation = async (req, res) => {
  const uid = req.params.uid;

  if (uid.startsWith('inv-')) {
    await addOrganisationToInvitation(uid, req);
  } else {
    await addOrganisationToUser(uid, req);
  }

  const permissionName = req.session.user.permission === 10000 ? 'approver' : 'end user';
  res.flash('info', `${req.session.user.firstName} ${req.session.user.lastName} now has ${permissionName} access to ${req.session.user.organisationName}`);
  return res.redirect(`/users/${uid}/services`);
};

module.exports = getConfirmAssociateOrganisation;
