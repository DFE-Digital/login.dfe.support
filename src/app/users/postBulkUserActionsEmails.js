/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { sendResult } = require('../../infrastructure/utils');
const { deactivate, deactivateInvite } = require('../../infrastructure/directories');
const {
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
  rejectOpenOrganisationRequestsForUser,
  rejectOpenUserServiceRequestsForUser,
  removeAllServicesForUser,
  removeAllServicesForInvitedUser,
  searchForBulkUsersPage,
} = require('./utils');

const validateInput = async (req) => {
  const model = {
    users: [],
    validationMessages: {},
  };

  const reqBody = req.body;
  const res = Object.keys(reqBody).filter((v) => v.startsWith('user-'));
  if (res.length === 0) {
    model.validationMessages.users = 'At least 1 user needs to be ticked';
  }

  const isDeactivateTicked = reqBody['deactivate-users'] || false;
  const isRemoveServicesAndRequestsTicked = reqBody['remove-services-and-requests'] || false;
  if (!isDeactivateTicked && !isRemoveServicesAndRequestsTicked) {
    model.validationMessages.actions = 'At least 1 action needs to be ticked';
  }

  return model;
};

const updateUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status = {
    id: 0,
    description: 'Deactivated',
  };

  await updateUserDetails(user, correlationId);
  await waitForIndexToUpdate(uid, (updated) => updated.status.id === 0);
};

const updateInvitedUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status.id = -2;
  user.status.description = 'Deactivated Invitation';

  await updateUserDetails(user, correlationId);
  await waitForIndexToUpdate(uid, (updated) => updated.status.id === -2);
};

const deactivateUser = async (req, id) => {
  await deactivate(id, req.id);
  await updateUserIndex(id, req.id);
};

const deactivateInvitedUser = async (req, userId) => {
  await deactivateInvite(userId, 'Bulk user deactivation', req.id);
  await updateInvitedUserIndex(userId, req.id);
};

const postBulkUserActionsEmails = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();

    // Need to search for all the users again if there's an error.  It's a little inefficient,
    // but realistically this page won't be generating many errors so this should be fairly infrequent.
    const emails = req.session.emails;
    const emailsArray = emails.split(',');
    for (const email of emailsArray) {
      const result = await searchForBulkUsersPage(email);
      for (const user of result) {
        model.users.push(user);
      }
    }
    return sendResult(req, res, 'users/views/bulkUserActionsEmails', model);
  }

  const reqBody = req.body;
  const isDeactivateTicked = reqBody['deactivate-users'] || false;
  const isRemoveServicesAndRequestsTicked = reqBody['remove-services-and-requests'] || false;

  // Get all the inputs and figure out which users were ticked
  const tickedUsers = Object.keys(reqBody).filter(v => v.startsWith('user-'));

  // eslint-disable-next-line no-restricted-syntax
  for (const tickedUser of tickedUsers) {
    // TODO add logging
    const userId = reqBody[tickedUser];
    if (isDeactivateTicked) {
      if (userId.startsWith('inv-')) {
        await deactivateInvitedUser(req, userId);
      } else {
        await deactivateUser(req, userId);
      }
    }

    if (isRemoveServicesAndRequestsTicked) {
      if (userId.startsWith('inv-')) {
        await removeAllServicesForInvitedUser(userId, req);
      } else {
        await rejectOpenUserServiceRequestsForUser(userId, req);
        await rejectOpenOrganisationRequestsForUser(userId, req);
        await removeAllServicesForUser(userId, req);
      }
    }
  }

  // Clean up session value
  req.session.emails = '';
  const userText = tickedUsers.length > 1 ? 'users' : 'user';
  res.flash('info', `Requested actions performed successfully on ${tickedUsers.length} ${userText}`);

  return res.redirect('/users');
};

module.exports = postBulkUserActionsEmails;
