const { NotificationClient } = require("login.dfe.jobs-client");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const {
  setUserAccessToOrganisation,
  getOrganisationById,
  getPendingRequestsAssociatedWithUser,
  updateRequestById,
} = require("../../infrastructure/organisations");
const {
  getSearchDetailsForUserById,
  updateIndex,
} = require("../../infrastructure/search");
const { waitForIndexToUpdate } = require("./utils");
const { isSupportEmailNotificationAllowed } = require("../services/utils");
const {
  addOrganisationToInvitation: apiClientAddOrganisationToInvitation,
} = require("login.dfe.api-client/invitations");

const addOrganisationToInvitation = async (uid, req) => {
  const invitationId = uid.substr(4);
  const { organisationId } = req.session.user;
  const { organisationName } = req.session.user;
  const permissionId = req.session.user.permission;

  await apiClientAddOrganisationToInvitation({
    invitationId,
    organisationId,
    roleId: permissionId,
  });

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) added organisation ${organisationName} (id: ${organisationId}) to invitation for ${req.session.user.email} (id: ${invitationId})`,
    {
      type: "support",
      subType: "user-invite-org",
      userId: req.user.sub,
      userEmail: req.user.email,
      invitedUserEmail: req.session.user.email,
      invitedOrganisation: organisationId,
    },
  );
};
const addOrganisationToUser = async (uid, req) => {
  const { organisationId } = req.session.user;
  const { organisationName } = req.session.user;
  const permissionId = req.session.user.permission;

  await setUserAccessToOrganisation(uid, organisationId, permissionId, req.id);

  const pendingOrgRequests = await getPendingRequestsAssociatedWithUser(
    uid,
    req.id,
  );
  const requestForOrg = pendingOrgRequests.find(
    (x) => x.org_id === organisationId,
  );
  if (requestForOrg) {
    // mark request as approved if outstanding for same org
    await updateRequestById(
      requestForOrg.id,
      1,
      req.user.sub,
      null,
      Date.now(),
      req.id,
    );
  }

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) added organisation ${organisationName} (id: ${organisationId}) to user for ${req.session.user.email} (id: ${uid})`,
    {
      type: "support",
      subType: "user-org",
      userId: req.user.sub,
      userEmail: req.user.email,
      organisationId,
      editedUser: uid,
      editedFields: [
        {
          name: "new_organisation",
          oldValue: undefined,
          newValue: organisationId,
        },
      ],
    },
  );
};

const getConfirmAssociateOrganisation = async (req, res) => {
  const { uid } = req.params;
  const isEmailAllowed = await isSupportEmailNotificationAllowed();

  if (uid.startsWith("inv-")) {
    await addOrganisationToInvitation(uid, req);
  } else {
    await addOrganisationToUser(uid, req);
    if (isEmailAllowed) {
      const notificationClient = new NotificationClient({
        connectionString: config.notifications.connectionString,
      });
      await notificationClient.sendUserAddedToOrganisation(
        req.session.user.email,
        req.session.user.firstName,
        req.session.user.lastName,
        req.session.user.organisationName,
      );
    }
    res.flash("info", `${req.session.user.email} added to organisation`);
  }

  // patch search with new org
  const searchDetails = await getSearchDetailsForUserById(uid);
  if (searchDetails) {
    const { organisations } = searchDetails;
    const newOrgById = await getOrganisationById(
      req.session.user.organisationId,
      req.id,
    );
    const newOrgForSearch = {
      id: newOrgById.id,
      name: newOrgById.name,
      categoryId: newOrgById.Category,
      statusId: newOrgById.Status,
      roleId: req.session.user.permission,
    };
    organisations.push(newOrgForSearch);
    const patchBody = {
      organisations,
    };
    await updateIndex(uid, patchBody, req.id);
    await waitForIndexToUpdate(
      uid,
      (updated) => updated.organisations.length === organisations.length,
    );
  }

  return res.redirect(`/users/${uid}/services`);
};

module.exports = getConfirmAssociateOrganisation;
