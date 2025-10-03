const config = require("./../../infrastructure/config");
const { sendResult } = require("./../../infrastructure/utils");
const { getUserDetailsById } = require("./utils");
const { ServiceNotificationsClient } = require("login.dfe.jobs-client");

const get = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid);

  sendResult(req, res, "users/views/webServiceSync", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    backLink: "organisations",
    currentPage: "users",
    user,
  });
};
const post = async (req, res) => {
  const serviceNotificationsClient = new ServiceNotificationsClient(
    config.notifications,
  );
  await serviceNotificationsClient.notifyUserUpdated({ sub: req.params.uid });

  res.flash("info", "User has been queued for sync");
  return res.redirect(`/users/${req.params.uid}/organisations`);
};
module.exports = {
  get,
  post,
};
