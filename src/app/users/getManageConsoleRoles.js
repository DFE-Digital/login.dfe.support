const config = require("../../infrastructure/config");
const { sendResult } = require("../../infrastructure/utils");
const { getUserDetails } = require("./utils");
const { getServiceById } = require("../../infrastructure/applications");
const {
  listRolesOfService,
  getSingleUserService,
  getSingleInvitationService,
} = require("../../infrastructure/access");

const manageServiceId = config.access.identifiers.manageService;
const dfeId = config.access.identifiers.departmentForEducation;

const getSingleServiceForUser = async (
  userId,
  organisationId,
  serviceId,
  correlationId,
) => {
  const userService = userId.startsWith("inv-")
    ? await getSingleInvitationService(
        userId.substr(4),
        serviceId,
        organisationId,
        correlationId,
      )
    : await getSingleUserService(
        userId,
        serviceId,
        organisationId,
        correlationId,
      );
  const application = await getServiceById(serviceId, correlationId);

  return {
    id: serviceId,
    roles: userService === undefined ? [] : userService.roles,
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
  const serviceSelectedByUser = await getServiceById(req.params.sid);
  const user = await getUserDetails(req);
  const userManageRoles = await getSingleServiceForUser(
    req.params.uid,
    dfeId,
    manageServiceId,
    req.id,
  );
  const manageConsoleRolesForAllServices =
    await listRolesOfService(manageServiceId);
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
    layout: "sharedViews/layoutNew.ejs",
    addOrChangeService,
    user,
    serviceSelectedByUser,
    manageConsoleRolesForSelectedService,
    userManageRoles,
    backLink: true,
    cancelLink: `/users/${user.id}/organisations`,
  });
};

module.exports = {
  getManageConsoleRoles,
  getSingleServiceForUser,
  addOrChangeManageConsoleServiceTitle,
  checkIfRolesChanged,
};
