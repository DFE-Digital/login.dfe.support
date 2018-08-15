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
  res.flash('info', `${fullname} no longer has access to ${org}`);
  return res.redirect(`/users/${uid}/organisations`);
};


module.exports = postDeleteOrganisation;
