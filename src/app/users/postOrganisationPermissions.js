const validate = (req) => {
  const validPermissionLevels = [0, 10000];

  const level = parseInt(req.body.selectedLevel);
  const model = {
    userFullName: `${req.session.newUser.firstName} ${req.session.newUser.lastName}`,
    organisationName: req.session.newUser.organisationName,
    selectedLevel: isNaN(level) ? undefined : level,
    validationMessages: {},
  };

  if (model.selectedLevel === undefined || model.selectedLevel === null) {
    model.validationMessages.selectedLevel = 'Please select a permission level';
  } else if (validPermissionLevels.find(x => x === model.selectedLevel) === undefined) {
    model.validationMessages.selectedLevel = 'Please select a permission level';
  }

  return model;
};

const postOrganisationPermissions = (req, res) => {
  const model = validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('users/views/organisationPermissions', model);
  }

  req.session.newUser.permission = model.selectedLevel;
  return res.redirect('confirm-new-user');
};

module.exports = postOrganisationPermissions;
