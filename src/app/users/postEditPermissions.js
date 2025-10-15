const { NotificationClient } = require("login.dfe.jobs-client");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const {
  getSearchDetailsForUserById,
  updateIndex,
} = require("../../infrastructure/search");
const { isSupportEmailNotificationAllowed } = require("../services/utils");
const { mapRole } = require("./utils");
const {
  addOrganisationToInvitation,
} = require("login.dfe.api-client/invitations");
const {
  addOrganisationToUser,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");

const validatePermissions = (req) => {
  const validPermissions = [0, 10000];
  const level = parseInt(req.body.selectedLevel, 10);
  const model = {
    userFullName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    organisationName: req.session.org.name,
    selectedLevel: isNaN(level) ? undefined : level,
    validationMessages: {},
  };
  if (model.selectedLevel === undefined || model.selectedLevel === null) {
    model.validationMessages.selectedLevel = "Please select a permission level";
  } else if (
    validPermissions.find((x) => x === model.selectedLevel) === undefined
  ) {
    model.validationMessages.selectedLevel = "Please select a permission level";
  }
  return model;
};

const editInvitationPermissions = async (uid, req, model) => {
  const invitationId = uid.substr(4);
  const organisationId = req.params.id;
  const permissionId = model.selectedLevel;
  await addOrganisationToInvitation({
    invitationId,
    organisationId,
    roleId: permissionId,
  });
};

const editUserPermissions = async (uid, req, model) => {
  const organisationId = req.params.id;
  const permissionId = model.selectedLevel;

  await addOrganisationToUser({
    organisationId,
    userId: uid,
    roleId: permissionId,
  });
};

const postEditPermissions = async (req, res) => {
  const model = validatePermissions(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("users/views/editPermissions", model);
  }
  const { uid } = req.params;
  const permissionName = mapRole(model.selectedLevel).description;
  const isEmailAllowed = await isSupportEmailNotificationAllowed();

  if (uid.startsWith("inv-")) {
    await editInvitationPermissions(uid, req, model);
  } else {
    const mngUserOrganisations = await getUserOrganisationsWithServicesRaw({
      userId: uid,
    });

    await editUserPermissions(uid, req, model);
    if (isEmailAllowed) {
      const mngUserOrganisationDetails = mngUserOrganisations.find(
        (x) => x.organisation.id === req.params.id,
      );
      const mngUserOrgPermission = {
        id: model.selectedLevel,
        name: permissionName,
        oldName: mngUserOrganisationDetails.role.name,
      };
      const notificationClient = new NotificationClient({
        connectionString: config.notifications.connectionString,
      });
      await notificationClient.sendUserPermissionChanged(
        req.session.user.email,
        req.session.user.firstName,
        req.session.user.lastName,
        model.organisationName,
        mngUserOrgPermission,
      );
    }
  }

  // patch search index
  const userSearchDetails = await getSearchDetailsForUserById(uid);
  if (userSearchDetails) {
    const currentOrgDetails = userSearchDetails.organisations;
    const organisations = currentOrgDetails.map((org) => {
      if (org.id === req.params.id) {
        return Object.assign({}, org, { roleId: model.selectedLevel });
      }
      return org;
    });
    const patchBody = {
      organisations,
    };
    await updateIndex(uid, patchBody, req.id);
  }

  const { organisationName } = model;
  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) edited permission level to ${permissionName} for organisation ${organisationName} (id: ${req.params.id}) for user ${req.session.user.email} (id: ${uid})`,
    {
      type: "support",
      subType: "user-org-permission-edited",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: uid,
      editedFields: [
        {
          organisation: organisationName,
          name: "edited_permission",
          newValue: permissionName,
        },
      ],
    },
  );
  res.flash(
    "info",
    `${req.session.user.email} now has ${permissionName} access`,
  );
  return res.redirect(`/users/${uid}/organisations`);
};

module.exports = postEditPermissions;
