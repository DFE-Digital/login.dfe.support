const config = require('./../../infrastructure/config');
const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetailsById } = require('./utils');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');

const get = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid, req.id);

  sendResult(req, res, 'users/views/webServiceSync', {
    csrfToken: req.csrfToken(),
    user,
  });
};
const post = async (req, res) => {
  const serviceNotificationsClient = new ServiceNotificationsClient(config.notifications);
  await serviceNotificationsClient.notifyUserUpdated({ sub: req.params.uid });

  res.flash('info', 'User has been queued for sync');
  return res.redirect(`/users/${req.params.uid}/organisations`);
};
module.exports = {
  get,
  post,
};
