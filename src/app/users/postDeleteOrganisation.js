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
  res.flash('info', 'Deactivate complete - Organisation has been deactivated');
  return res.redirect(`/users/${uid}/organisations`);
};


module.exports = postDeleteOrganisation;
