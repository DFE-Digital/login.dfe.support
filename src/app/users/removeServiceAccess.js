const { NotificationClient } = require("login.dfe.jobs-client");
const { deleteUserServiceAccess } = require("login.dfe.api-client/users");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const {
  deleteServiceAccessFromInvitation,
} = require("login.dfe.api-client/invitations");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("../../infrastructure/organisations");
const {
  getServiceById,
  isSupportEmailNotificationAllowed,
} = require("../../infrastructure/applications");

const get = async (req, res) => {
  const userId = req.params.uid;
  if (!req.session.user) {
    return res.redirect(`/users/${userId}/organisations`);
  }

  const userOrganisations = userId.startsWith("inv-")
    ? await getInvitationOrganisations(userId.substr(4), req.id)
    : await getUserOrganisations(userId, req.id);
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === req.params.orgId,
  );
  const service = await getServiceById(req.params.sid, req.id);

  return res.render("users/views/removeService", {
    backLink: true,
    csrfToken: req.csrfToken(),
    organisationDetails,
    service,
    user: {
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
      uid: req.params.uid,
    },
  });
};

const post = async (req, res) => {
  const { uid } = req.params;
  if (!req.session.user) {
    return res.redirect(`/users/${uid}/organisations`);
  }

  const serviceId = req.params.sid;
  const organisationId = req.params.orgId;
  const service = await getServiceById(req.params.sid, req.id);
  const userOrganisations = uid.startsWith("inv-")
    ? await getInvitationOrganisations(uid.substr(4), req.id)
    : await getUserOrganisations(uid, req.id);
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === req.params.orgId,
  );
  const isEmailAllowed = await isSupportEmailNotificationAllowed();

  if (uid.startsWith("inv-")) {
    await deleteServiceAccessFromInvitation({
      invitationId: uid.substr(4),
      serviceId,
      organisationId,
    });
  } else {
    await deleteUserServiceAccess({ userId: uid, serviceId, organisationId });
    if (isEmailAllowed) {
      const notificationClient = new NotificationClient({
        connectionString: config.notifications.connectionString,
      });
      await notificationClient.sendUserServiceRemoved(
        req.session.user.email,
        req.session.user.firstName,
        req.session.user.lastName,
        service.name,
        organisationDetails.organisation.name,
      );
    }
  }

  logger.audit(
    `${req.user.email} removed service ${service.name} for user ${req.session.user.email}`,
    {
      type: "support",
      subType: "user-service-deleted",
      userId: req.user.sub,
      userEmail: req.user.email,
      organisationId,
      editedUser: uid,
      editedFields: [
        {
          name: "remove_service",
          oldValue: serviceId,
          newValue: undefined,
        },
      ],
    },
  );
  res.flash("info", `${service.name} successfully removed`);
  return res.redirect(`/users/${uid}/services`);
};

module.exports = {
  get,
  post,
};
