const { getAndMapOrgRequest } = require('./utils');
const { updateRequestById } = require('./../../infrastructure/organisations');
const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config');
const NotificationClient = require('login.dfe.notifications.client');

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

const get = async (req, res) => {
  return res.render('accessRequests/views/rejectOrganisationRequest', {
    csrfToken: req.csrfToken(),
    title: 'Reason for rejection - DfE Sign-in',
    backLink: `/access-requests`,
    cancelLink: `/access-requests`,
    reason: '',
    validationMessages: {},
  })
};

const validate = async (req) => {
  const request = await getAndMapOrgRequest(req);
  const model = {
    title: 'Reason for rejection - DfE Sign-in',
    backLink: `/access-requests`,
    cancelLink: `/access-requests`,
    reason: req.body.reason,
    request,
    validationMessages: {},
  };
  if (model.reason.length > 1000) {
    model.validationMessages.reason = 'Reason cannot be longer than 1000 characters';
  } else if (model.request.status.id === -1 || model.request.status.id === 1) {
    model.validationMessages.reason = `Request already actioned by ${model.request.usersEmail}`
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('accessRequests/views/rejectOrganisationRequest', model);
  }
  // patch request with rejection
  const actionedDate = Date.now();
  await updateRequestById(model.request.id, -1, req.user.sub, model.reason, actionedDate, req.id);

  //send rejected email
  await notificationClient.sendAccessRequest(model.request.usersEmail, model.request.usersName, model.request.org_name, false, null);

  //audit organisation rejected
  logger.audit(`${req.user.email} (id: ${req.user.sub}) rejected organisation request for ${model.request.org_id})`, {
    type: 'approver',
    subType: 'rejected-org',
    userId: req.user.sub,
    editedUser: model.request.user_id,
    reason: model.reason,
  });

  res.flash('info', `Request rejected - an email has been sent to ${model.request.usersEmail}.`);
  return res.redirect(`/access-requests`);


};

module.exports = {
  get,
  post,
};
