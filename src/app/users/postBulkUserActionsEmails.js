const logger = require("../../infrastructure/logger");
const { sendResult } = require("../../infrastructure/utils");
const { updateInvitation } = require("login.dfe.api-client/invitations");
const {
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
  rejectOpenOrganisationRequestsForUser,
  rejectOpenUserServiceRequestsForUser,
  removeAllServicesForUser,
  removeAllServicesForInvitedUser,
  searchForBulkUsersPage,
} = require("./utils");
const {
  deactivateUser: apiClientDeactivateUser,
} = require("login.dfe.api-client/users");

const validateInput = async (req) => {
  const model = {
    layout: "sharedViews/layout.ejs",
    backLink: "../bulk-user-actions",
    currentPage: "users",
    users: [],
    validationMessages: {},
  };

  const reqBody = req.body;
  const res = Object.keys(reqBody).filter((v) => v.startsWith("user-"));
  if (res.length === 0) {
    model.validationMessages.users = "At least 1 user needs to be ticked";
  }

  const isDeactivateTicked = reqBody["deactivate-users"] || false;
  const isRemoveServicesAndRequestsTicked =
    reqBody["remove-services-and-requests"] || false;
  if (!isDeactivateTicked && !isRemoveServicesAndRequestsTicked) {
    model.validationMessages.actions = "At least 1 action needs to be ticked";
  }

  return model;
};

const updateUserIndex = async (user) => {
  user.status = {
    id: 0,
    description: "Deactivated",
  };

  await updateUserDetails(user);
  await waitForIndexToUpdate(user.id, (updated) => updated.status.id === 0);
};

const updateInvitedUserIndex = async (user) => {
  user.status.id = -2;
  user.status.description = "Deactivated Invitation";

  await updateUserDetails(user);
  await waitForIndexToUpdate(user.id, (updated) => updated.status.id === -2);
};

const deactivateUser = async (req, user, reason) => {
  await apiClientDeactivateUser({ userId: user.id, reason });
  await updateUserIndex(user);
};

const deactivateInvitedUser = async (req, user) => {
  await updateInvitation({
    invitationId: user.id.replace("inv-", ""),
    reason: "Bulk user deactivation",
    deactivated: true,
  });
  await updateInvitedUserIndex(user);
};

const postBulkUserActionsEmails = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();

    // Need to search for all the users again if there's an error.  It's a little inefficient,
    // but realistically this page won't be generating many errors so this should be fairly infrequent.
    const emails = req.session.emails;
    const emailsArray = emails.split(",");
    for (const email of emailsArray) {
      const result = await searchForBulkUsersPage(email);
      for (const user of result.users) {
        let emailNotDuplicate = true;
        // Loop over every user we've found to see if there's a duplicate.  If so, skip it and move on.
        model.users.find((o) => {
          if (o.email === user.email) {
            emailNotDuplicate = false;
            return true; // Stop searching now that we know there's a duplicate
          }
        });
        if (emailNotDuplicate) {
          model.users.push(user);
        }
      }
    }
    return sendResult(req, res, "users/views/bulkUserActionsEmails", model);
  }

  const reqBody = req.body;
  const isDeactivateTicked = reqBody["deactivate-users"] || false;
  const isRemoveServicesAndRequestsTicked =
    reqBody["remove-services-and-requests"] || false;
  const userDeactivationReason = "Bulk user actions - deactivation";

  // Get all the inputs and figure out which users were ticked
  const tickedUsers = Object.keys(reqBody).filter((v) => v.startsWith("user-"));

  for (const tickedUser of tickedUsers) {
    const userId = reqBody[tickedUser];
    const user = await getUserDetailsById(userId);
    if (isDeactivateTicked) {
      if (userId.startsWith("inv-")) {
        await deactivateInvitedUser(req, user);
        logger.audit(
          `${req.user.email} (id: ${req.user.sub}) deactivated user invitation ${user.email} (id: ${userId})`,
          {
            type: "support",
            subType: "user-edit",
            userId: req.user.sub,
            userEmail: req.user.email,
            editedUser: userId,
            editedFields: [
              {
                name: "status",
                oldValue: user.status.id,
                newValue: -2,
              },
            ],
            reason: userDeactivationReason,
          },
        );
      } else {
        await deactivateUser(req, user, userDeactivationReason);
        logger.audit(
          `${req.user.email} (id: ${req.user.sub}) deactivated user ${
            user.email
          } (id: ${userId})`,
          {
            type: "support",
            subType: "user-edit",
            userId: req.user.sub,
            userEmail: req.user.email,
            editedUser: userId,
            editedFields: [
              {
                name: "status",
                oldValue: user.status.id,
                newValue: 0,
              },
            ],
            reason: userDeactivationReason,
          },
        );
      }
    }

    if (isRemoveServicesAndRequestsTicked) {
      if (userId.startsWith("inv-")) {
        await removeAllServicesForInvitedUser(userId, req);
      } else {
        await rejectOpenUserServiceRequestsForUser(userId, req);
        await rejectOpenOrganisationRequestsForUser(userId, req);
        await removeAllServicesForUser(userId, req);
      }
    }
  }

  // Clean up session value
  req.session.emails = "";
  const userText = tickedUsers.length > 1 ? "users" : "user";
  res.flash(
    "info",
    `Requested actions performed successfully on ${tickedUsers.length} ${userText}`,
  );

  return res.redirect("/users");
};

module.exports = postBulkUserActionsEmails;
