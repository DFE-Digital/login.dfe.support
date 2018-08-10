const { setUserAccessToOrganisation, addInvitationOrganisation } = require('./../../infrastructure/organisations');
const validatePermissions = (req) => {
  const validPermissions = [0, 10000];
  const level = parseInt(req.body.selectedLevel);
  const model = {
    userFullName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    organisationName: req.session.org.name,
    selectedLevel: isNaN(level) ? undefined : level,
    validationMessages: {},
  };
  if (model.selectedLevel === undefined || model.selectedLevel === null) {
    model.validationMessages.selectedLevel = 'Please select a permission level';
  } else if (validPermissions.find(x => x === model.selectedLevel) === undefined) {
    model.validationMessages.selectedLevel = 'Please select a permission level';
  }
  return model;
};

const editInvitationPermissions = async(uid, req, model) => {
  const invitationId = uid.substr(4);
  const organisationId = req.params.id;
  const permissionId = model.selectedLevel;
  await addInvitationOrganisation(invitationId, organisationId, permissionId, req.id);
};

const editUserPermissions = async(uid, req, model) => {
  const organisationId = req.params.id;
  const permissionId = model.selectedLevel;

  await setUserAccessToOrganisation(uid, organisationId, permissionId, req.id);
};


const postEditPermissions = async (req, res) => {
  const model = validatePermissions(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('users/views/editPermissions', model);
  }
  const uid = req.params.uid;
  if (uid.startsWith('inv-')) {
    await editInvitationPermissions(uid, req, model);
  } else {
    await editUserPermissions(uid, req, model);
  }
  const fullname = model.userFullName;
  const organisationName = model.organisationName;
  const permissionName = model.selectedLevel === 10000 ? 'approver' : 'end user';
  res.flash('info', `${fullname} now has ${permissionName} access to ${organisationName} `);
  return res.redirect(`/users/${uid}/organisations`);
};

module.exports = postEditPermissions;