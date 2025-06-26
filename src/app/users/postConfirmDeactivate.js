const logger = require("../../infrastructure/logger");
const {
  getUserDetails,
  getUserDetailsById,
  rejectOpenOrganisationRequestsForUser,
  rejectOpenUserServiceRequestsForUser,
  removeAllServicesForUser,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");

const { deactivate } = require("../../infrastructure/directories");
const { sendResult } = require("../../infrastructure/utils");

const updateUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status = {
    id: 0,
    description: "Deactivated",
  };

  await updateUserDetails(user, correlationId);
  await waitForIndexToUpdate(uid, (updated) => updated.status.id === 0);
};

const validateInput = (req) => {
  const model = {
    reason: req.body.reason,
    selectReason: req.body["select-reason"],
    validationMessages: {},
  };
  const isDefaultDropdownReasonSelected =
    model.selectReason && model.selectReason === "Select a reason";

  if (isDefaultDropdownReasonSelected) {
    if (model.reason.trim().length === 0) {
      model.validationMessages.reason = "Please give a reason for deactivation";
    }
    if (model.reason.length > 1000) {
      model.validationMessages.reason =
        "Reason cannot be longer than 1000 characters";
    }
  } else {
    if (model.reason.trim().length > 0) {
      // Only need to do a length check if a typed reason has been provided added as all the
      // dropdown reasons are nowhere near 1000 characters
      const reasonLengthToBeTested = `${req.body["select-reason"]} - ${model.reason}`;
      if (reasonLengthToBeTested.length > 1000) {
        model.validationMessages.reason =
          "Reason cannot be longer than 1000 characters";
      }
    }
  }

  return model;
};

const postConfirmDeactivate = async (req, res) => {
  const model = validateInput(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return sendResult(req, res, "users/views/confirmDeactivate", {
      csrfToken: req.csrfToken(),
      layout: "sharedViews/layoutNew.ejs",
      backLink: "services",
      reason: model.reason,
      validationMessages: model.validationMessages,
    });
  }

  // Now that we're sure we've got a sensible payload, start getting details and reshaping data
  const isNonDefaultDropdownReasonSelected =
    model.selectReason && model.selectReason !== "Select a reason";
  const user = await getUserDetails(req);
  let reason = model.reason.trim();
  if (isNonDefaultDropdownReasonSelected) {
    if (reason.length === 0) {
      reason = req.body["select-reason"];
    } else {
      // If it non default and not empty then both are populated, and we combine them with a - in the middle
      reason = `${req.body["select-reason"]} - ${model.reason}`;
    }
  }

  await deactivate(user.id, reason, req.id);
  await updateUserIndex(user.id, req.id);

  if (req.body["remove-services-and-requests"]) {
    await rejectOpenUserServiceRequestsForUser(user.id, req);
    await rejectOpenOrganisationRequestsForUser(user.id, req);
    await removeAllServicesForUser(user.id, req);
  }

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) deactivated user ${
      user.email
    } (id: ${user.id})`,
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
          newValue: 0,
        },
      ],
      reason: reason,
    },
  );

  return res.redirect("services");
};

module.exports = postConfirmDeactivate;
