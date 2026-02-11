const {
  NotificationClient,
  ServiceNotificationsClient,
} = require("login.dfe.jobs-client");
const asyncRetry = require("login.dfe.async-retry");
const {
  deleteUserServiceAccess,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const {
  deleteServiceAccessFromInvitation,
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");
const { isSupportEmailNotificationAllowed } = require("../services/utils");
const { getServiceRaw } = require("login.dfe.api-client/services");

const get = async (req, res) => {
  const userId = req.params.uid;
  if (!req.session.user) {
    return res.redirect(`/users/${userId}/organisations`);
  }

  const userOrganisations = userId.startsWith("inv-")
    ? await getInvitationOrganisationsRaw({ invitationId: userId.substr(4) })
    : await getUserOrganisationsWithServicesRaw({ userId });
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === req.params.orgId,
  );
  const service = await getServiceRaw({ by: { serviceId: req.params.sid } });

  return res.render("users/views/removeService", {
    backLink: true,
    currentPage: "users",
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
  const service = await getServiceRaw({ by: { serviceId: req.params.sid } });
  const userOrganisations = uid.startsWith("inv-")
    ? await getInvitationOrganisationsRaw({ userId: uid.substr(4) })
    : await getUserOrganisationsWithServicesRaw({ userId: uid });
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

    const serviceNotificationsClient = new ServiceNotificationsClient(
      config.notifications,
    );
    try {
      await asyncRetry(
        async () =>
          await serviceNotificationsClient.notifyUserUpdated({ sub: uid }),
        asyncRetry.strategies.apiStrategy,
      );
      logger.audit(
        `WS Sync notification succeeded for user ${uid} after service access removal`,
        {
          type: "support",
          subType: "user-sync-notify-succeeded",
          userId: req.user.sub,
          userEmail: req.user.email,
          editedUser: uid,
          organisationId,
          editedFields: [
            {
              name: "remove_service",
              oldValue: serviceId,
              newValue: undefined,
            },
          ],
          success: true,
        },
      );
    } catch (e) {
      logger.error(
        `Failed to notify legacy WS Sync on user update for ${uid}`,
        e,
      );
      logger.audit(
        `WS Sync notification failed for user ${uid} after service access removal`,
        {
          type: "support",
          subType: "user-sync-notify-failed",
          userId: req.user.sub,
          userEmail: req.user.email,
          editedUser: uid,
          organisationId,
          editedFields: [
            {
              name: "remove_service",
              oldValue: serviceId,
              newValue: undefined,
            },
          ],
          success: false,
        },
      );
      res.flash(
        "warning",
        "Sync notification to legacy WS service failed. You can retry from 'Sync user' page.",
      );
    }
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
