const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config');
const NotificationClient = require('login.dfe.notifications.client');
const { deleteUserOrganisation, deleteInvitationOrganisation } = require('./../../infrastructure/organisations');
const { getAllServicesForUserInOrg } = require('./utils');
const { removeServiceFromInvitation, removeServiceFromUser } = require('./../../infrastructure/access');
const { getSearchDetailsForUserById, updateIndex } = require('./../../infrastructure/search');

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
  const organisationId = req.params.id;
  const servicesForUserInOrg = await getAllServicesForUserInOrg(uid, organisationId, req.id);

  if (uid.startsWith('inv-')) {
    for (let i = 0; i < servicesForUserInOrg.length; i++) {
      const service = servicesForUserInOrg[i];
      await removeServiceFromInvitation(uid.substr(4), service.id, organisationId, req.id);
    }
    await deleteInvitationOrg(uid, req);
  } else {
    for (let i = 0; i < servicesForUserInOrg.length; i++) {
      const service = servicesForUserInOrg[i];
      await removeServiceFromUser(uid, service.id, organisationId, req.id);
    }
    await deleteUserOrg(uid, req);
    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });
    await notificationClient.sendUserRemovedFromOrganisation(req.session.user.email, req.session.user.firstName, req.session.user.lastName, req.session.org.name);
  }

  //patch search index
  const searchDetails = await getSearchDetailsForUserById(uid);
  if (searchDetails) {
    const currentOrgDetails = searchDetails.organisations;
    const organisations = currentOrgDetails.filter(org => org.id !== organisationId);
    const patchBody = {
      organisations
    };
    await updateIndex(uid, patchBody, req.id);
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
