const logger = require("../../infrastructure/logger");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
  removeAllServicesForInvitedUser,
} = require("./utils");
const { deactivateInvite } = require("../../infrastructure/directories");
const { sendResult } = require("../../infrastructure/utils");

const updateUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status.id = -2;
  user.status.description = "Deactivated Invitation";

  await updateUserDetails(user, correlationId);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === -2);
};

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);

  if (
    req.body["select-reason"] &&
    req.body["select-reason"] !== "Select a reason" &&
    req.body.reason.trim() === ""
  ) {
    req.body.reason = req.body["select-reason"];
  } else if (
    req.body["select-reason"] &&
    req.body["select-reason"] !== "Select a reason" &&
    req.body.reason.length > 0
  ) {
    req.body.reason = `${req.body["select-reason"]} - ${req.body.reason}`;
  }

  if (
    req.body["select-reason"] &&
    req.body["select-reason"] === "Select a reason" &&
    req.body.reason.match(/^\s*$/) !== null
  ) {
    sendResult(req, res, "users/views/confirmDeactivate", {
      csrfToken: req.csrfToken(),
      backLink: "services",
      reason: "",
      validationMessages: {
        reason: "Please give a reason for deactivation",
      },
    });
  } else {
    await deactivateInvite(user.id, req.body.reason, req.id);
    await updateUserIndex(user.id, req.id);
    if (req.body["remove-services-from-invite"]) {
      await removeAllServicesForInvitedUser(user.id, req);
    }

    logger.audit(
      `${req.user.email} (id: ${req.user.sub}) deactivated user invitation ${user.email} (id: ${user.id})`,
      {
        type: "support",
        subType: "user-edit",
        userId: req.user.sub,
        userEmail: req.user.email,
        editedUser: user.id,
        editedFields: [
          {
            name: "status",
            oldValue: user.status.id,
            newValue: -2,
          },
        ],
        reason: req.body.reason,
      },
    );

    return res.redirect("services");
  }
};

module.exports = postConfirmDeactivate;
