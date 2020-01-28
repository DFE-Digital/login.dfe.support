const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config');
const NotificationClient = require('login.dfe.notifications.client');
const { setUserAccessToOrganisation, addInvitationOrganisation } = require('./../../infrastructure/organisations');
const { getSearchDetailsForUserById, updateIndex } = require('./../../infrastructure/search');

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
  const permissionName = model.selectedLevel === 10000 ? 'approver' : 'end user';
  
  if (uid.startsWith('inv-')) {
    await editInvitationPermissions(uid, req, model);
  } else {
    await editUserPermissions(uid, req, model);
    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });    
    await notificationClient.sendUserPermissionChanged(req.session.user.email, req.session.user.firstName, req.session.user.lastName, model.organisationName, permissionName);
    res.flash('info', `Email notification of user permission changed to ${permissionName}, sent to ${req.session.user.firstName} ${req.session.user.lastName}`);
  }

  // patch search index
  const userSearchDetails = await getSearchDetailsForUserById(uid);
  if (userSearchDetails) {
    const currentOrgDetails = userSearchDetails.organisations;
    const organisations = currentOrgDetails.map( org => {
      if (org.id === req.params.id) {
        return Object.assign({}, org, {roleId:model.selectedLevel})
      }
      return org
    });
    const patchBody = {
      organisations
    };
    await updateIndex(uid, patchBody, req.id);
  }

  const fullname = model.userFullName;
  const organisationName = model.organisationName;
  logger.audit(`${req.user.email} (id: ${req.user.sub}) edited permission level to ${permissionName} for organisation ${organisationName} (id: ${req.params.id}) for user ${req.session.user.email} (id: ${uid})`, {
    type: 'support',
    subType: 'user-org-permission-edited',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: uid,
    editedFields: [{
      organisation: organisationName,
      name: 'edited_permission',
      newValue: permissionName,
    }],
  });
  res.flash('info', `${fullname} now has ${permissionName} access to ${organisationName} `);
  return res.redirect(`/users/${uid}/organisations`);
};

module.exports = postEditPermissions;
