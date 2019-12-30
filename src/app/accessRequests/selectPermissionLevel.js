const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config');
const { getAndMapOrgRequest } = require('./utils');
const { getSearchDetailsForUserById, updateIndex } = require('./../../infrastructure/search');
const { waitForIndexToUpdate } = require('../users/utils');
const { putUserInOrganisation, updateRequestById, getOrganisationById } = require('./../../infrastructure/organisations');
const NotificationClient = require('login.dfe.notifications.client');

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});
const get = async (req, res) => {
  const request = await getAndMapOrgRequest(req);

  return res.render('accessRequests/views/selectPermissionLevel', {
    csrfToken: req.csrfToken(),
    request,
    title: 'Select permission level - DfE Sign-in',
    backLink: true,
    cancelLink: `/access-requests`,
    selectedLevel: null,
    validationMessages: {},
  });
};

const validate = async (req) => {
  const request = await getAndMapOrgRequest(req);
  const validPermissionLevels = [0, 10000];

  const level = parseInt(req.body.selectedLevel);
  const model = {
    request,
    title: 'Select permission level - DfE Sign-in',
    backLink: true,
    cancelLink: `/access-requests`,
    selectedLevel: isNaN(level) ? undefined : level,
    validationMessages: {},
  };

  if (model.selectedLevel === undefined || model.selectedLevel === null) {
    model.validationMessages.selectedLevel = 'A permission level must be selected';
  } else if (validPermissionLevels.find(x => x === model.selectedLevel) === undefined) {
    model.validationMessages.selectedLevel = 'A permission level must be selected';
  } else if (model.request.approverEmail) {
    model.validationMessages.reason = `Request already actioned by ${model.request.approverEmail}`
  }

  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('accessRequests/views/selectPermissionLevel', model);
  }
  try {
    // patch search index with organisation added to user
    const getAllUserDetails = await getSearchDetailsForUserById(model.request.user_id);
    const organisation = await getOrganisationById(model.request.org_id, req.id);

    if (!getAllUserDetails) {
      logger.error(`Failed to find user ${model.request.user_id} when confirming change of organisations`, { correlationId: req.id });
    } else if (!organisation) {
      logger.error(`Failed to find organisation ${model.request.org_id} when confirming change of organisations`, { correlationId: req.id });
    } else {
      const currentOrganisationDetails = getAllUserDetails.organisations;
      const newOrgDetails = {
        id: organisation.id,
        name: organisation.name,
        urn: organisation.urn || undefined,
        uid: organisation.uid || undefined,
        establishmentNumber: organisation.establishmentNumber || undefined,
        laNumber: organisation.localAuthority ? organisation.localAuthority.code : undefined,
        categoryId: organisation.category != null ? organisation.category.id : undefined,
        statusId: organisation.status != null ? organisation.status.id : undefined,
        roleId: 0,
      };
      currentOrganisationDetails.push(newOrgDetails);
      await updateIndex(model.request.user_id, currentOrganisationDetails, null, req.id);
      await waitForIndexToUpdate(model.request.user_id, updated => updated.organisations.length === currentOrganisationDetails.length);
    }

    const actionedDate = Date.now();
    await putUserInOrganisation(model.request.user_id, model.request.org_id, 1, model.selectedLevel, req.id);
    await updateRequestById(model.request.id, 1, req.user.sub, null, actionedDate, req.id);

    // send approved email
    await notificationClient.sendAccessRequest(model.request.usersEmail, model.request.usersName, organisation.name, true, null);

    // audit organisation approved
    logger.audit(`${req.user.email} (id: ${req.user.sub}) approved organisation request for ${model.request.org_id})`, {
      type: 'approver',
      subType: 'approved-org',
      userId: req.user.sub,
      editedUser: model.request.user_id,
      editedFields: [{
        name: 'new_organisation',
        oldValue: undefined,
        newValue: model.request.org_id,
      }],
    });
  } catch (e) {
    throw new Error(`Failed to put user in organisation: (correlationId: ${req.id}, userId: ${req.user.sub}, requesterId: ${model.request.user_id}, requestedOrgId: ${model.request.org_id}, error: ${e.message}`);
  }

  res.flash('info', `Request approved - an email has been sent to ${model.request.usersEmail}. You can now add services for this user.`);
  return res.redirect('/access-requests');
};

module.exports = {
  get,
  post,
};
