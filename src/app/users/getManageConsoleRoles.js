const config = require("../../infrastructure/config");
const { sendResult } = require("../../infrastructure/utils");
const { getUserDetailsById } = require("./utils");
const { getUserServiceRaw } = require("login.dfe.api-client/users");
const { getInvitationServiceRaw } = require("login.dfe.api-client/invitations");
const {
  getServiceRolesRaw,
  getServiceRaw,
} = require("login.dfe.api-client/services");

const manageServiceId = config.access.identifiers.manageService;
const dfeId = config.access.identifiers.departmentForEducation;

const getSingleServiceForUser = async (userId, organisationId, serviceId) => {
  const userService = userId.startsWith("inv-")
    ? await getInvitationServiceRaw({
        invitationId: userId.substr(4),
        serviceId,
        organisationId,
      })
    : await getUserServiceRaw({ userId, serviceId, organisationId });
  const application = await getServiceRaw({ by: { serviceId } });

  return {
    id: serviceId,
    roles: userService?.roles ?? [],
    name: application.name,
  };
};

const addOrChangeManageConsoleServiceTitle = (
  userManageRoles,
  manageConsoleRoleIds,
) => {
  return userManageRoles.roles
    .map((role) => role.id)
    .some((roleId) => manageConsoleRoleIds.includes(roleId));
};

const checkIfRolesChanged = (rolesSelectedBeforeSession, newRolesSelected) => {
  return !(
    JSON.stringify(rolesSelectedBeforeSession.sort()) ===
    JSON.stringify(newRolesSelected.sort())
  );
};

const getManageConsoleRoles = async (req, res) => {
  const serviceSelectedByUser = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const user = await getUserDetailsById(req.params.uid, req);
  const userManageRoles = await getSingleServiceForUser(
    req.params.uid,
    dfeId,
    manageServiceId,
  );
  const manageConsoleRolesForAllServices = await getServiceRolesRaw({
    serviceId: manageServiceId,
  });
  const manageConsoleRolesForSelectedService =
    manageConsoleRolesForAllServices.filter(
      (service) => service.code.split("_")[0] === req.params.sid,
    );
  const manageConsoleRoleIds = manageConsoleRolesForSelectedService.map(
    (service) => service.id,
  );
  const addOrChangeService = addOrChangeManageConsoleServiceTitle(
    userManageRoles,
    manageConsoleRoleIds,
  );

  sendResult(req, res, "users/views/selectManageConsoleRoles", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    addOrChangeService,
    user,
    serviceSelectedByUser,
    manageConsoleRolesForSelectedService,
    userManageRoles,
    backLink: true,
    currentPage: "users",
    cancelLink: `/users/${user.id}/organisations`,
  });
};

module.exports = {
  getManageConsoleRoles,
  getSingleServiceForUser,
  addOrChangeManageConsoleServiceTitle,
  checkIfRolesChanged,
};
