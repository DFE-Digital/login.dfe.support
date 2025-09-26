const { NotificationClient } = require("login.dfe.jobs-client");
const { get: getSafePath } = require("lodash");
const {
  getAllServices,
  isSupportEmailNotificationAllowed,
} = require("../services/utils");
const config = require("../../infrastructure/config");
const {
  listRolesOfService,
  addUserService,
  updateUserService,
} = require("../../infrastructure/access");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("../../infrastructure/organisations");
const {
  addServiceToInvitation,
  updateInvitationServiceRoles,
} = require("login.dfe.api-client/invitations");
const logger = require("../../infrastructure/logger");

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

  const userServices = getSafePath(req, "session.user.services", []);
  const services = userServices.map((service) => ({
    id: service.serviceId,
    name: "",
    roles: service.roles,
  }));

  if (userServices.length) {
    const allServices = await getAllServices(req.id);

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const serviceDetails = allServices.services.find(
        (x) => x.id === service.id,
      );
      const allRolesOfService = await listRolesOfService(service.id, req.id);
      const roleDetails = allRolesOfService.filter((x) =>
        service.roles.find((y) => y.toLowerCase() === x.id.toLowerCase()),
      );
      service.name = serviceDetails.name;
      service.roles = roleDetails;
    }
  }

  return res.render("users/views/confirmAddService", {
    backLink: true,
    layout: "sharedViews/layout.ejs",
    changeLink: req.session.user.isAddService
      ? `/users/${userId}/organisations/${req.params.orgId}`
      : `/users/${userId}/organisations/${req.params.orgId}/services/${req.session.user.services[0].serviceId}`,
    currentPage: "users",
    csrfToken: req.csrfToken(),
    user: {
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
      isAddService: req.session.user.isAddService,
      uid: userId,
    },
    services,
    organisationDetails,
  });
};

const post = async (req, res) => {
  const { uid } = req.params;
  if (!req.session.user) {
    return res.redirect(`/users/${uid}/organisations`);
  }

  const isEmailAllowed = await isSupportEmailNotificationAllowed();
  const organisationId = req.params.orgId;

  const callServiceToInvitationFunc = async (
    apiFn,
    { invitationId, serviceId, organisationId, serviceRoleIds },
  ) => {
    try {
      return await apiFn({
        invitationId,
        serviceId,
        organisationId,
        serviceRoleIds,
      });
    } catch (e) {
      const status = e.statusCode ? e.statusCode : 500;
      if (status === 403) {
        return false;
      }
      if (status === 409) {
        return false;
      }
      throw e;
    }
  };

  if (req.session.user.services) {
    const allServices = await getAllServices();

    for (let i = 0; i < req.session.user.services.length; i++) {
      const service = req.session.user.services[i];
      const invitationId = uid.startsWith("inv-") ? uid.substr(4) : undefined;

      if (invitationId) {
        req.session.user.isAddService
          ? await callServiceToInvitationFunc(addServiceToInvitation, {
              invitationId,
              serviceId: service.serviceId,
              organisationId,
              serviceRoleIds: service.roles,
            })
          : await callServiceToInvitationFunc(updateInvitationServiceRoles, {
              invitationId,
              serviceId: service.serviceId,
              organisationId,
              serviceRoleIds: service.roles,
            });
      } else {
        req.session.user.isAddService
          ? await addUserService(
              uid,
              service.serviceId,
              organisationId,
              service.roles,
              req.id,
            )
          : await updateUserService(
              uid,
              service.serviceId,
              organisationId,
              service.roles,
              req.id,
            );
      }

      if (isEmailAllowed && (invitationId === undefined || !invitationId)) {
        const userOrganisations = invitationId
          ? await getInvitationOrganisations(invitationId, req.id)
          : await getUserOrganisations(uid, req.id);
        const organisationDetails = userOrganisations.find(
          (x) => x.organisation.id === organisationId,
        );
        const userOrgPermission = {
          id: organisationDetails.role.id,
          name: organisationDetails.role.name,
        };
        const serviceDetails = allServices.services.find(
          (x) => x.id === service.serviceId,
        );
        const allRolesOfService = await listRolesOfService(
          service.serviceId,
          req.id,
        );
        const roleDetails = allRolesOfService.filter((x) =>
          service.roles.find((y) => y.toLowerCase() === x.id.toLowerCase()),
        );

        const notificationClient = new NotificationClient({
          connectionString: config.notifications.connectionString,
        });
        await notificationClient.sendServiceRequestApproved(
          req.session.user.email,
          req.session.user.firstName,
          req.session.user.lastName,
          organisationDetails.organisation.name,
          serviceDetails.name,
          roleDetails.map((i) => i.name),
          userOrgPermission,
        );
      }
    }
  }

  if (req.session.user.isAddService) {
    logger.audit(
      `${req.user.email} added ${req.session.user.services.length} service(s) for user ${req.session.user.email}`,
      {
        type: "support",
        subType: "user-services-added",
        userId: req.user.sub,
        userEmail: req.user.email,
        organisationId,
        editedUser: uid,
        editedFields: [
          {
            name: "add_services",
            newValue: req.session.user.services,
          },
        ],
      },
    );
    res.flash("info", "Services successfully added");
  } else {
    logger.audit(
      `${req.user.email} updated service ${req.session.user.services[0].name} for user ${req.session.user.email}`,
      {
        type: "support",
        subType: "user-service-updated",
        userId: req.user.sub,
        userEmail: req.user.email,
        organisationId,
        editedUser: uid,
        editedFields: [
          {
            name: "update_service",
            newValue: req.session.user.services,
          },
        ],
      },
    );
    res.flash(
      "info",
      `${req.session.user.services[0].name} updated successfully`,
    );
  }
  res.redirect(`/users/${uid}/services`);
};

module.exports = {
  get,
  post,
};
