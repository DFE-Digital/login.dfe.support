const { putUserInOrganisation, updateRequestById, getOrganisationById } = require('./../../infrastructure/organisations');
const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config');
const { getSearchDetailsForUserById, updateIndex } = require('./../../infrastructure/search');
const { waitForIndexToUpdate } = require('../users/utils');
const { getAndMapOrgRequest } = require('./utils');
const NotificationClient = require('login.dfe.notifications.client');

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

const get = async (req, res) => {
  const request = await getAndMapOrgRequest(req);

  return res.render('accessRequests/views/reviewOrganisationRequest', {
    csrfToken: req.csrfToken(),
    title: 'Review request - DfE Sign-in',
    backLink: `/access-requests`,
    cancelLink: `/access-requests`,
    request,
    selectedResponse: null,
    validationMessages: {},
  })
};

const validate = async (req) => {
  const request = await getAndMapOrgRequest(req);
  const model = {
    title: 'Review request - DfE Sign-in',
    backLink: `/access-requests`,
    cancelLink: `/access-requests`,
    request,
    selectedResponse: req.body.selectedResponse,
    validationMessages: {},
  };
  if (model.selectedResponse === undefined || model.selectedResponse === null) {
    model.validationMessages.selectedResponse = 'Approve or Reject must be selected';
  } else if (model.request.approverEmail) {
    model.validationMessages.selectedResponse = `Request already actioned by ${model.request.approverEmail}`
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('accessRequests/views/reviewOrganisationRequest', model);
  }

  if (model.selectedResponse === 'reject') {
    return res.redirect(`reject`)
  }
  
  try { 
    // patch search index with organisation added to user
    const getAllUserDetails = await getSearchDetailsForUserById(model.request.user_id);
    const organisation = await getOrganisationById(model.request.org_id, req.id);

    if (!getAllUserDetails) {
      logger.error(`Failed to find user ${model.request.user_id} when confirming change of organisations`, {correlationId: req.id});
    } else if (!organisation) {
      logger.error(`Failed to find organisation ${model.request.org_id} when confirming change of organisations`, {correlationId: req.id})
    } else {
      const currentOrganisationDetails = getAllUserDetails.organisations;
      const newOrgDetails = {
        id: organisation.id,
        name: organisation.name,
        urn: organisation.urn || undefined,
        uid: organisation.uid || undefined,
        establishmentNumber: organisation.establishmentNumber || undefined,
        laNumber: organisation.localAuthority ? organisation.localAuthority.code : undefined,
        categoryId: organisation.category,
        statusId: organisation.status,
        roleId: 0,
      };
      currentOrganisationDetails.push(newOrgDetails);
      await updateIndex(model.request.user_id, currentOrganisationDetails, null, req.id);
      await waitForIndexToUpdate(model.request.user_id, (updated) => updated.organisations.length === currentOrganisationDetails.length);
    }
  
    const actionedDate = Date.now();
    await putUserInOrganisation(model.request.user_id, model.request.org_id, 0, null, req.id);
    await updateRequestById(model.request.id, 1, req.user.sub, null, actionedDate, req.id);

    //send approved email
    await notificationClient.sendAccessRequest(model.request.usersEmail, model.request.usersName, organisation.name, true, null);
  
    //audit organisation approved
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
  return res.redirect(`/access-requests`);
};

module.exports = {
  get,
  post,
};
