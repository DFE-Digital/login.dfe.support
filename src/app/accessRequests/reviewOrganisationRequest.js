const { putUserInOrganisation, updateRequestById, getOrganisationById } = require('./../../infrastructure/organisations');
const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config');
const { getById, updateIndex } = require('./../../infrastructure/search');
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

module.exports = {
  get,
};
