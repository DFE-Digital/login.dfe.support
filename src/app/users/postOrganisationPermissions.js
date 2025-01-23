const validate = (req) => {
  const validPermissionLevels = [0, 10000];

  const level = parseInt(req.body.selectedLevel);
  const model = {
    userFullName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    organisationName: req.session.user.organisationName,
    selectedLevel: isNaN(level) ? undefined : level,
    validationMessages: {},
  };

  if (model.selectedLevel === undefined || model.selectedLevel === null) {
    model.validationMessages.selectedLevel = "Please select a permission level";
  } else if (
    validPermissionLevels.find((x) => x === model.selectedLevel) === undefined
  ) {
    model.validationMessages.selectedLevel = "Please select a permission level";
  }

  return model;
};

const postOrganisationPermissions = async (req, res) => {
  const model = validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("users/views/organisationPermissions", model);
  }

  req.session.user.permission = model.selectedLevel;
  return res.redirect(
    req.params.uid ? "confirm-associate-organisation" : "confirm-new-user",
  );
};

module.exports = postOrganisationPermissions;
