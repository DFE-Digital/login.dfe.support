const logger = require('./../../infrastructure/logger');
const { deleteUserOrganisation, deleteInvitationOrganisation } = require('./../../infrastructure/organisations');

const deleteInvitationOrg = async (uid, req) => {
  const invitationId =  uid.substr(4);
  const organisationId = req.params.id;
  await deleteInvitationOrganisation(invitationId, organisationId);
};

const deleteUserOrg = async (uid, req) => {
  const organisationId = req.params.id;
  await deleteUserOrganisation(uid, organisationId);
};

const postDeleteOrganisation = async (req, res) => {
  const uid = req.params.uid;
  if (uid.startsWith('inv-')) {
    await deleteInvitationOrg(uid, req);
  } else {
    await deleteUserOrg(uid, req);
  }
  const fullname = `${req.session.user.firstName} ${req.session.user.lastName}`;
  const org = req.session.org.name;
  logger.audit(`${req.user.email} (id: ${req.user.sub}) removed organisation ${org} (id: ${req.params.id}) for user ${req.session.user.email} (id: ${uid})`, {
    type: 'support',
    subType: 'user-org-deleted',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: uid,
    editedFields: [{
      name: 'new_organisation',
      oldValue: req.params.id,
      newValue: undefined,
    }],
  });
  res.flash('info', `${fullname} no longer has access to ${org}`);
  return res.redirect(`/users/${uid}/organisations`);
};


module.exports = postDeleteOrganisation;
