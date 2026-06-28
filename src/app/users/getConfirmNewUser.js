const { getAllServices } = require("../services/utils");

const isTruthy = (v) => v === true || v === 1 || v === "true" || v === "1";
const isHiddenFromSupport = (s) => {
  if (s.isIdOnlyService) {
    const params = s.relyingParty?.params;
    return (
      isTruthy(s.isHiddenService) &&
      isTruthy(params?.hideApprover) &&
      isTruthy(params?.hideSupport) &&
      isTruthy(params?.helpHidden)
    );
  }
  return isTruthy(s.relyingParty?.params?.hideSupport);
};

const getRoleName = (id) => {
  switch (id) {
    case 0:
      return "End user";
    case 10000:
      return "Approver";
    default:
      throw new Error(`Unrecognised role ${id}`);
  }
};

const getConfirmNewUser = async (req, res) => {
  const oidcClients = await getAllServices();

  return res.render("users/views/confirmNewUser", {
    csrfToken: req.csrfToken(),
    user: {
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
    },
    organisation: req.session.user.organisationId
      ? {
          id: req.session.user.organisationId,
          name: req.session.user.organisationName,
        }
      : undefined,
    role: req.session.user.organisationId
      ? {
          id: req.session.user.permission,
          name: getRoleName(req.session.user.permission),
        }
      : "",
    oidcClients: oidcClients.services.filter((s) => !isHiddenFromSupport(s)),
    backLink: true,
    currentPage: "users",
    layout: "sharedViews/layout.ejs",
  });
};

module.exports = getConfirmNewUser;
