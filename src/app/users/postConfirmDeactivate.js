const logger = require("../../infrastructure/logger");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");

const {
  getUserServiceRequestsByUserId,
  updateUserServiceRequest,
  getServicesByUserId,
  removeServiceFromUser,
} = require("../../infrastructure/access");
const {
  getPendingRequestsAssociatedWithUser,
  updateRequestById,
} = require("../../infrastructure/organisations");
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
  const correlationId = req.id;
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
    const userServiceRequests =
      (await getUserServiceRequestsByUserId(user.id)) || [];
    logger.info(
      `Rejecting ${userServiceRequests.length} service request(s) from user ${user.id}`,
      { correlationId },
    );
    for (const serviceRequest of userServiceRequests) {
      // Request status 0 is 'pending', 2 is 'overdue', 3 is 'no approvers'
      if (
        serviceRequest.status === 0 ||
        serviceRequest.status === 2 ||
        serviceRequest.status === 3
      ) {
        logger.info(`Rejecting service request with id: ${serviceRequest.id}`, {
          correlationId,
        });
        const requestBody = {
          status: -1,
          actioned_reason: "User deactivation",
          actioned_by: req.user.sub,
          actioned_at: new Date(),
        };
        updateUserServiceRequest(serviceRequest.id, requestBody, req.id);
      }
    }

    const organisationRequests =
      (await getPendingRequestsAssociatedWithUser(user.id)) || [];
    logger.info(
      `Rejecting ${organisationRequests.length} organisation request(s) from user ${user.id}`,
      { correlationId },
    );
    for (const organisationRequest of organisationRequests) {
      // Request status 0 is 'pending', 2 is 'overdue' and 3 is 'no approvers'
      if (
        organisationRequest.status.id === 0 ||
        organisationRequest.status.id === 2 ||
        organisationRequest.status.id === 3
      ) {
        logger.info(
          `Rejecting organisation request with id: ${organisationRequest.id}`,
          { correlationId },
        );
        const status = -1;
        const actionedReason = "User deactivation";
        const actionedBy = req.user.sub;
        const actionedAt = new Date();
        updateRequestById(
          organisationRequest.id,
          status,
          actionedBy,
          actionedReason,
          actionedAt,
          req.id,
        );
      }
    }

    const userServices = (await getServicesByUserId(user.id)) || [];
    logger.info(
      `Removing ${userServices.length} service(s) from user ${user.id}`,
      { correlationId },
    );
    for (const service of userServices) {
      logger.info(
        `Removing service from user: ${service.userId} with serviceId: ${service.serviceId} and organisationId: ${service.organisationId}`,
        { correlationId },
      );
      removeServiceFromUser(
        service.userId,
        service.serviceId,
        service.organisationId,
        req.id,
      );
    }
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
