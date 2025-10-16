const logger = require("./../../infrastructure/logger");
const config = require("./../../infrastructure/config");
const { NotificationClient } = require("login.dfe.jobs-client");
const {
  deleteUserServiceAccess,
  searchUserByIdRaw,
  updateUserDetailsInSearchIndex,
} = require("login.dfe.api-client/users");
const {
  deleteServiceAccessFromInvitation,
} = require("login.dfe.api-client/invitations");
const {
  deleteUserOrganisation,
  deleteInvitationOrganisation,
} = require("./../../infrastructure/organisations");
const {
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const { getAllServicesForUserInOrg } = require("./utils");
const { isSupportEmailNotificationAllowed } = require("../services/utils");
const {
  getSearchDetailsForUserById,
} = require("./userSearchHelpers/getSearchDetailsForUserById");

const deleteInvitationOrg = async (uid, req) => {
  const invitationId = uid.substr(4);
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
  const servicesForUserInOrg = await getAllServicesForUserInOrg(
    uid,
    organisationId,
  );
  const isEmailAllowed = await isSupportEmailNotificationAllowed();

  // Invocation has to happen before deleteUserOrg otherwise it will return []
  const userOrgs = uid.startsWith("inv-")
    ? []
    : await getUserOrganisationsWithServicesRaw({ userId: uid });

  if (uid.startsWith("inv-")) {
    for (let i = 0; i < servicesForUserInOrg.length; i++) {
      const service = servicesForUserInOrg[i];
      await deleteServiceAccessFromInvitation({
        invitationId: uid.substr(4),
        serviceId: service.id,
        organisationId,
      });
    }
    await deleteInvitationOrg(uid, req);
  } else {
    for (let i = 0; i < servicesForUserInOrg.length; i++) {
      const service = servicesForUserInOrg[i];
      await deleteUserServiceAccess({
        userId: uid,
        serviceId: service.id,
        organisationId,
      });
    }
    await deleteUserOrg(uid, req);
    if (isEmailAllowed) {
      const userDetails = await searchUserByIdRaw({ userId: uid });
      if (userDetails.statusId === 1) {
        const notificationClient = new NotificationClient({
          connectionString: config.notifications.connectionString,
        });
        await notificationClient.sendUserRemovedFromOrganisation(
          req.session.user.email,
          req.session.user.firstName,
          req.session.user.lastName,
          req.session.org.name,
        );
      }
    }
  }

  //patch search index
  const searchDetails = await getSearchDetailsForUserById(uid);
  if (searchDetails) {
    const currentOrgDetails = searchDetails.organisations;
    const organisations = currentOrgDetails.filter(
      (org) => org.id !== organisationId,
    );
    await updateUserDetailsInSearchIndex({
      userId: uid,
      organisations,
    });
  }

  const fullname = `${req.session.user.firstName} ${req.session.user.lastName}`;
  const org = req.session.org.name;

  let hasLegacyId = false;
  let numericIdentifier = {};
  let textIdentifier = {};
  let numericAndTextIdentifier = {};

  const deletedOrg = userOrgs.filter(
    (org) => org.organisation.id === organisationId,
  );

  if (
    deletedOrg[0]?.["numericIdentifier"] &&
    deletedOrg[0]?.["textIdentifier"]
  ) {
    numericIdentifier["numericIdentifier"] = deletedOrg[0]["numericIdentifier"];
    textIdentifier["textIdentifier"] = deletedOrg[0]["textIdentifier"];
    numericAndTextIdentifier = { ...numericIdentifier, ...textIdentifier };
    hasLegacyId = true;
  }

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) removed organisation ${org} (id: ${req.params.id}) for user ${req.session.user.email} (id: ${uid}), (legacyId: ${
      hasLegacyId ? JSON.stringify(numericAndTextIdentifier) : "null"
    })`,
    {
      type: "support",
      subType: "user-org-deleted",
      userId: req.user.sub,
      userEmail: req.user.email,
      organisationId,
      editedUser: uid,
      editedFields: [
        {
          name: "new_organisation",
          oldValue: req.params.id,
          newValue: undefined,
        },
      ],
      ...(hasLegacyId && { ...numericAndTextIdentifier }),
    },
  );
  res.flash("info", `${fullname} no longer has access to ${org}`);
  return res.redirect(`/users/${uid}/organisations`);
};

module.exports = postDeleteOrganisation;
