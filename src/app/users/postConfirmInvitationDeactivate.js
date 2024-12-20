/* eslint-disable no-restricted-syntax */
const logger = require('../../infrastructure/logger');
const {
  getUserDetails, getUserDetailsById, updateUserDetails, waitForIndexToUpdate,
} = require('./utils');
const { deactivateInvite } = require('../../infrastructure/directories');
const { getServicesByInvitationId, removeServiceFromInvitation } = require('../../infrastructure/access');
const { sendResult } = require('../../infrastructure/utils');

const updateUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status.id = -2;
  user.status.description = 'Deactivated Invitation';

  await updateUserDetails(user, correlationId);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === -2);
};

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);
  const correlationId = req.id;
  
  if (req.body['select-reason'] && req.body['select-reason'] !== 'Select a reason' && req.body.reason.trim() === '') {
    req.body.reason = req.body['select-reason'];
  } else if (req.body['select-reason'] && req.body['select-reason'] !== 'Select a reason' && req.body.reason.length > 0) {
    req.body.reason = `${req.body['select-reason']} - ${req.body.reason}`;
  };

  if (req.body['select-reason'] && req.body['select-reason'] === 'Select a reason' && req.body.reason.match(/^\s*$/) !== null) {
    sendResult(req, res, 'users/views/confirmDeactivate', {
      csrfToken: req.csrfToken(),
      backLink: 'services',
      reason: '',
      validationMessages: {
        reason: 'Please give a reason for deactivation',
      },
    });
  } else {
    await deactivateInvite(user.id, req.body.reason, req.id);
    await updateUserIndex(user.id, req.id);
    if (req.body['remove-services-from-invite']) {
      logger.info(`Attemping to remove services from invite with id: ${req.params.uid}`, { correlationId });
      // No need to get the invitation to double check as getUserDetails does that already, if we're here then the invite definitely exists.
      // getUserDetails parrots back the 'inv-<uuid>' as its id instead of giving us the true one without the 'inv-' prefix.
      const invitationServiceRecords = await getServicesByInvitationId(user.id.substr(4)) || [];
      for (const serviceRecord of invitationServiceRecords) {
        logger.info(`Deleting invitation service record for invitationId: ${serviceRecord.invitationId}, serviceId: ${serviceRecord.serviceId} and organisationId: ${serviceRecord.organisationIdId}`, { correlationId });
        removeServiceFromInvitation(serviceRecord.invitationId, serviceRecord.serviceId, serviceRecord.organisationId, req.id);
      }
    }

    logger.audit(`${req.user.email} (id: ${req.user.sub}) deactivated user invitation ${user.email} (id: ${user.id})`, {
      type: 'support',
      subType: 'user-edit',
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: user.id,
      editedFields: [
        {
          name: 'status',
          oldValue: user.status.id,
          newValue: -2,
        },
      ],
      reason: req.body.reason,
    });

    return res.redirect('services');
  }
};

module.exports = postConfirmDeactivate;
