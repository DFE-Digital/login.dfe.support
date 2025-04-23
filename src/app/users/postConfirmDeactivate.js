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

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);
  const correlationId = req.id;
  // If just the dropdown is selected, have the reason be that.  If both dropdown and text are used, then the reason
  //  is both of them separated with a '-'
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
      layout: "sharedViews/layoutNew.ejs",
      backLink: "services",
      reason: "",
      validationMessages: {
        reason: "Please give a reason for deactivation",
      },
    });
  } else {
    await deactivate(user.id, req.body.reason, req.id);
    await updateUserIndex(user.id, req.id);
    if (req.body["remove-services-and-requests"]) {
      const userServiceRequests =
        (await getUserServiceRequestsByUserId(user.id)) || [];
      for (const serviceRequest of userServiceRequests) {
        // Request status 0 is 'pending', 2 is 'overdue', 3 is 'no approvers'
        if (
          serviceRequest.status === 0 ||
          serviceRequest.status === 2 ||
          serviceRequest.status === 3
        ) {
          logger.info(
            `Rejecting service request with id: ${serviceRequest.id}`,
            { correlationId },
          );
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
        reason: req.body.reason,
      },
    );

    return res.redirect("services");
  }
};

module.exports = postConfirmDeactivate;
