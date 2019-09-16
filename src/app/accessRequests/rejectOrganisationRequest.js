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

module.exports = {
  get,
};
