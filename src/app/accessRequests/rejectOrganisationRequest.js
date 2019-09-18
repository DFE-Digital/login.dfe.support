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

const post = async (req, res) => {
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
