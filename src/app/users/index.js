const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const { isLoggedIn, setCurrentArea } = require("../../infrastructure/utils");
const isAuthorizedToChangeEmail = require("../../infrastructure/utils/isAuthorizedToChangeEmail");
const logger = require("../../infrastructure/logger");

const search = require("./search");
const getOrganisations = require("./getOrganisations");
const getServices = require("./getServices");
const getAudit = require("./getAudit");
const getEditProfile = require("./getEditProfile");
const postEditProfile = require("./postEditProfile");
const getEditEmail = require("./getEditEmail");
const postEditEmail = require("./postEditEmail");
const getConfirmDeactivate = require("./getConfirmDeactivate");
const postConfirmDeactivate = require("./postConfirmDeactivate");
const getConfirmInvitationDeactivate = require("./getConfirmInvitationDeactivate");
const postConfirmInvitationDeactivate = require("./postConfirmInvitationDeactivate");
const getConfirmReactivate = require("./getConfirmReactivate");
const postConfirmReactivate = require("./postConfirmReactivate");
const getConfirmInvitationReactivate = require("./getConfirmInvitationReactivate");
const postConfirmInvitationReactivate = require("./postConfirmInvitationReactivate");
const getNewUser = require("./getNewUser");
const postNewUser = require("./postNewUser");
const getAssociateOrganisation = require("./getAssociateOrganisation");
const postAssociateOrganisation = require("./postAssociateOrganisation");
const getOrganisationPermissions = require("./getOrganisationPermissions");
const postOrganisationPermissions = require("./postOrganisationPermissions");
const getConfirmNewUser = require("./getConfirmNewUser");
const postConfirmNewUser = require("./postConfirmNewUser");
const getBulkUserActions = require("./getBulkUserActions");
const postBulkUserActions = require("./postBulkUserActions");
const getBulkUserActionsEmails = require("./getBulkUserActionsEmails");
const postBulkUserActionsEmails = require("./postBulkUserActionsEmails");
const postCancelChangeEmail = require("./postCancelChangeEmail");
const getConfirmAssociateOrganisation = require("./getConfirmAssociateOrganisation");
const postResendInvite = require("./postResendInvite");
const getEditPermissions = require("./getEditPermissions");
const postEditPermissions = require("./postEditPermissions");
const getDeleteOrganisation = require("./getDeleteOrganisation");
const postDeleteOrganisation = require("./postDeleteOrganisation");
const getSecureAccess = require("./getSecureAccessDetails");
const postUpdateAuditLog = require("./postUpdateAuditLog");
const getManageConsoleServices = require("./getManageConsoleServices");
const postManageConsoleRoles = require("./postManageConsoleRoles");
const { getManageConsoleRoles } = require("./getManageConsoleRoles");
const {
  get: getAssociateServices,
  post: postAssociateServices,
} = require("./associateServices");
const {
  get: getSelectOrganisation,
  post: postSelectOrganisation,
} = require("./selectOrganisation");
const {
  get: getAssociateRoles,
  post: postAssociateRoles,
} = require("./associateRoles");
const {
  get: getConfirmAddService,
  post: postConfirmAddService,
} = require("./confirmAddService");
const {
  get: getRemoveServiceAccess,
  post: postRemoveServiceAccess,
} = require("./removeServiceAccess");
const {
  get: getWebServiceSync,
  post: postWebServiceSync,
} = require("./webServiceSync");

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.debug("Mounting user routes");

  router.use(isLoggedIn);
  router.use(setCurrentArea("users"));

  router.get("/", csrf, asyncWrapper(search.get));
  router.post("/", csrf, asyncWrapper(search.post));

  router.get("/new-user", csrf, asyncWrapper(getNewUser));
  router.post("/new-user", csrf, asyncWrapper(postNewUser));
  router.get(
    "/associate-organisation",
    csrf,
    asyncWrapper(getAssociateOrganisation),
  );
  router.post(
    "/associate-organisation",
    csrf,
    asyncWrapper(postAssociateOrganisation),
  );
  router.get(
    "/organisation-permissions",
    csrf,
    asyncWrapper(getOrganisationPermissions),
  );
  router.post(
    "/organisation-permissions",
    csrf,
    asyncWrapper(postOrganisationPermissions),
  );
  router.get("/confirm-new-user", csrf, asyncWrapper(getConfirmNewUser));
  router.post("/confirm-new-user", csrf, asyncWrapper(postConfirmNewUser));
  router.get("/bulk-user-actions", csrf, asyncWrapper(getBulkUserActions));
  router.post("/bulk-user-actions", csrf, asyncWrapper(postBulkUserActions));
  router.get(
    "/bulk-user-actions/emails",
    csrf,
    asyncWrapper(getBulkUserActionsEmails),
  );
  router.post(
    "/bulk-user-actions/emails",
    csrf,
    asyncWrapper(postBulkUserActionsEmails),
  );

  router.get(
    "/:uid",
    asyncWrapper((req, res) => {
      res.redirect(`/users/${req.params.uid}/organisations`);
    }),
  );
  router.get("/:uid/organisations", csrf, asyncWrapper(getOrganisations));
  router.get(
    "/:uid/organisations/:id/edit-permission",
    csrf,
    asyncWrapper(getEditPermissions),
  );
  router.post(
    "/:uid/organisations/:id/edit-permission",
    csrf,
    asyncWrapper(postEditPermissions),
  );
  router.get(
    "/:uid/organisations/:id/remove-organisation",
    csrf,
    asyncWrapper(getDeleteOrganisation),
  );
  router.post(
    "/:uid/organisations/:id/remove-organisation",
    csrf,
    asyncWrapper(postDeleteOrganisation),
  );
  router.get("/:uid/services", csrf, asyncWrapper(getServices));
  router.get("/:uid/audit", csrf, asyncWrapper(getAudit));
  router.get("/:uid/resend-invitation", csrf, asyncWrapper(postResendInvite));
  router.get("/:uid/secure-access", csrf, asyncWrapper(getSecureAccess));

  router.get("/:uid/edit-profile", csrf, asyncWrapper(getEditProfile));
  router.post("/:uid/edit-profile", csrf, asyncWrapper(postEditProfile));

  router.get(
    "/:uid/manage-console-services",
    csrf,
    asyncWrapper(getManageConsoleServices),
  );
  router.get(
    "/:uid/add-manage-console-roles/:sid",
    csrf,
    asyncWrapper(getManageConsoleRoles),
  );
  router.post(
    "/:uid/add-manage-console-roles/:sid",
    csrf,
    asyncWrapper(postManageConsoleRoles),
  );

  router.get(
    "/:uid/confirm-deactivation",
    csrf,
    asyncWrapper(getConfirmDeactivate),
  );
  router.post(
    "/:uid/confirm-deactivation",
    csrf,
    asyncWrapper(postConfirmDeactivate),
  );

  router.get(
    "/:uid/edit-email",
    csrf,
    isAuthorizedToChangeEmail,
    asyncWrapper(getEditEmail),
  );
  router.post(
    "/:uid/edit-email",
    csrf,
    isAuthorizedToChangeEmail,
    asyncWrapper(postEditEmail),
  );

  router.get(
    "/:uid/confirm-invitation-deactivation",
    csrf,
    asyncWrapper(getConfirmInvitationDeactivate),
  );
  router.post(
    "/:uid/confirm-invitation-deactivation",
    csrf,
    asyncWrapper(postConfirmInvitationDeactivate),
  );

  router.get(
    "/:uid/confirm-reactivation",
    csrf,
    asyncWrapper(getConfirmReactivate),
  );
  router.post(
    "/:uid/confirm-reactivation",
    csrf,
    asyncWrapper(postConfirmReactivate),
  );

  router.get(
    "/:uid/confirm-invitation-reactivation",
    csrf,
    asyncWrapper(getConfirmInvitationReactivate),
  );
  router.post(
    "/:uid/confirm-invitation-reactivation",
    csrf,
    asyncWrapper(postConfirmInvitationReactivate),
  );

  router.post(
    "/:uid/cancel-change-email",
    csrf,
    asyncWrapper(postCancelChangeEmail),
  );

  router.get(
    "/:uid/associate-organisation",
    csrf,
    asyncWrapper(getAssociateOrganisation),
  );
  router.post(
    "/:uid/associate-organisation",
    csrf,
    asyncWrapper(postAssociateOrganisation),
  );
  router.get(
    "/:uid/organisation-permissions",
    csrf,
    asyncWrapper(getOrganisationPermissions),
  );
  router.post(
    "/:uid/organisation-permissions",
    csrf,
    asyncWrapper(postOrganisationPermissions),
  );
  router.get(
    "/:uid/confirm-associate-organisation",
    csrf,
    asyncWrapper(getConfirmAssociateOrganisation),
  );

  router.get(
    "/:uid/select-organisation",
    csrf,
    asyncWrapper(getSelectOrganisation),
  );
  router.post(
    "/:uid/select-organisation",
    csrf,
    asyncWrapper(postSelectOrganisation),
  );

  router.get("/:uid/web-service-sync", csrf, asyncWrapper(getWebServiceSync));
  router.post("/:uid/web-service-sync", csrf, asyncWrapper(postWebServiceSync));

  router.get(
    "/:uid/organisations/:orgId",
    csrf,
    asyncWrapper(getAssociateServices),
  );
  router.post(
    "/:uid/organisations/:orgId",
    csrf,
    asyncWrapper(postAssociateServices),
  );

  router.get(
    "/:uid/organisations/:orgId/services/:sid",
    csrf,
    asyncWrapper(getAssociateRoles),
  );
  router.post(
    "/:uid/organisations/:orgId/services/:sid",
    csrf,
    asyncWrapper(postAssociateRoles),
  );
  router.get(
    "/:uid/organisations/:orgId/services/:sid/remove-service",
    csrf,
    asyncWrapper(getRemoveServiceAccess),
  );
  router.post(
    "/:uid/organisations/:orgId/services/:sid/remove-service",
    csrf,
    asyncWrapper(postRemoveServiceAccess),
  );

  router.get(
    "/:uid/organisations/:orgId/confirm",
    csrf,
    asyncWrapper(getConfirmAddService),
  );
  router.post(
    "/:uid/organisations/:orgId/confirm",
    csrf,
    asyncWrapper(postConfirmAddService),
  );
  router.post("/:uid/audit", csrf, asyncWrapper(postUpdateAuditLog));

  return router;
};

module.exports = users;
