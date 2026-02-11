const config = require("./../../infrastructure/config");
const { sendResult } = require("./../../infrastructure/utils");
const { getUserDetailsById } = require("./utils");
const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const asyncRetry = require("login.dfe.async-retry");
const logger = require("./../../infrastructure/logger");

const get = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid, req);

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
  try {
    await asyncRetry(
      async () =>
        await serviceNotificationsClient.notifyUserUpdated({
          sub: req.params.uid,
        }),
      asyncRetry.strategies.apiStrategy,
    );
    logger.audit(
      `WS Sync notification succeeded when queuing user ${req.params.uid} from user sync page`,
      {
        type: "support",
        subType: "user-sync-notify-succeeded",
        userId: req.user.sub,
        userEmail: req.user.email,
        editedUser: req.params.uid,
        success: true,
      },
    );
    res.flash("info", "User has been queued for sync");
  } catch (e) {
    logger.error(
      `Failed to queue user ${req.params.uid} for legacy WS Sync`,
      e,
    );
    logger.audit(
      `WS Sync notification failed when queuing user ${req.params.uid} from user sync page`,
      {
        type: "support",
        subType: "user-sync-notify-failed",
        userId: req.user.sub,
        userEmail: req.user.email,
        editedUser: req.params.uid,
        success: false,
      },
    );
    res.flash(
      "error",
      "Sync notification to legacy WS service failed. Please try again later.",
    );
  }
  return res.redirect(`/users/${req.params.uid}/organisations`);
};
module.exports = {
  get,
  post,
};
