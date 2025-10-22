const config = require("../../infrastructure/config");
const { sendResult } = require("../../infrastructure/utils");
const { getUserDetailsById, callServiceToUserFunc } = require("./utils");
const {
  getServiceRolesRaw,
  getServiceRaw,
} = require("login.dfe.api-client/services");
const {
  addServiceToUser,
  updateUserServiceRoles,
  addOrganisationToUser,
} = require("login.dfe.api-client/users");
const {
  getSingleServiceForUser,
  addOrChangeManageConsoleServiceTitle,
  checkIfRolesChanged,
} = require("./getManageConsoleRoles");

const manageServiceId = config.access.identifiers.manageService;
const dfeId = config.access.identifiers.departmentForEducation;

const postManageConsoleRoles = async (req, res) => {
  let rolesSelectedNew = req.body.role ? req.body.role : [];
  if (!(rolesSelectedNew instanceof Array)) {
    rolesSelectedNew = [req.body.role];
  }

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
  let manageConsoleRoleIds = [];
  manageConsoleRolesForSelectedService.forEach((obj) =>
    manageConsoleRoleIds.push(obj.id),
  );

  const addOrChangeService = addOrChangeManageConsoleServiceTitle(
    userManageRoles,
    manageConsoleRoleIds,
  );

  for (let i = 0; i < rolesSelectedNew.length; i++) {
    if (!manageConsoleRoleIds.includes(rolesSelectedNew[i])) {
      sendResult(req, res, "users/views/selectManageConsoleRoles", {
        csrfToken: req.csrfToken(),
        layout: "sharedViews/layout.ejs",
        user,
        serviceSelectedByUser,
        addOrChangeService,
        manageConsoleRolesForSelectedService,
        userManageRoles,
        backLink: true,
        validationMessages: {
          roleSelection: "You have selected an invalid role for this service",
        },
        cancelLink: `/users/${user.id}/organisations`,
      });
    }
  }

  let currentRoles = [];
  userManageRoles.roles.forEach((role) => currentRoles.push(role.id));

  const allSelectedRoles = [...new Set(currentRoles.concat(rolesSelectedNew))];
  const rolesToRemove = manageConsoleRoleIds.filter(
    (id) => !rolesSelectedNew.includes(id),
  );
  const newRoles = allSelectedRoles.filter((id) => !rolesToRemove.includes(id));

  if (!checkIfRolesChanged(currentRoles, newRoles)) {
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
  } else if (user.hasManageAccess) {
    await callServiceToUserFunc(updateUserServiceRoles, {
      userId: req.params.uid,
      serviceId: manageServiceId,
      organisationId: dfeId,
      serviceRoleIds: newRoles,
    });

    res.flash("info", [
      `Roles updated`,
      `The selected roles have been updated for ${serviceSelectedByUser.name}`,
    ]);
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
  } else {
    await addOrganisationToUser({
      organisationId: dfeId,
      userId: req.params.uid,
      status: 1,
      roleId: 0,
    });

    await callServiceToUserFunc(addServiceToUser, {
      userId: req.params.uid,
      serviceId: manageServiceId,
      organisationId: dfeId,
      serviceRoleIds: newRoles,
    });

    res.flash("info", [
      `Roles updated`,
      `The selected roles have been updated for ${serviceSelectedByUser.name}`,
    ]);
    return res.redirect(`/users/${req.params.uid}/manage-console-services`);
  }
};

module.exports = postManageConsoleRoles;
