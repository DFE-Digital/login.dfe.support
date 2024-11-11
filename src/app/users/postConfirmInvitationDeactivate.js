const logger = require('../../infrastructure/logger');
const { getUserDetails, getUserDetailsById, updateUserDetails, waitForIndexToUpdate } = require('./utils');
const { deactivateInvite, getInvitation } = require('../../infrastructure/directories');
const { getServicesByInvitationId } = require('../../infrastructure/access');
const { sendResult } = require('../../infrastructure/utils');
const { getInvitationOrganisations } = require('../../infrastructure/organisations');

const updateUserIndex = async (uid, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.status.id = -2;
  user.status.description = 'Deactivated Invitation';

  await updateUserDetails(user, correlationId);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === -2);
};

const postConfirmDeactivate = async (req, res) => {
  const user = await getUserDetails(req);

  if (req.body.reason.match(/^\s*$/) !== null) {
    sendResult(req, res, 'users/views/confirmDeactivate', {
      csrfToken: req.csrfToken(),
      backLink: 'services',
      reason: '',
      validationMessages: {
        reason: 'Please give a reason for deactivation',
      },
    });
  } else {
    // await deactivateInvite(user.id, req.body.reason, req.id);
    // await updateUserIndex(user.id, req.id);
    if (req.body['remove-services-and-requests']) {
      // Invite uuid should be in the form of 'inv-<a uuid>'
      const invitation = await getInvitation(req.params.uid.substr(4), req.id);
      logger.info(invitation);
      logger.info('-----------------');
      const invitationServiceRecord = await getServicesByInvitationId(invitation.id);
      if (invitationServiceRecord !== undefined) {
        logger.info(invitationServiceRecord);
        logger.info('going to delete record');
        // removeServiceFromInvitation(invitation.id, invitationServiceRecord.serviceId, invitationServiceRecord.organisationId, req.id);
      }
    }

    // logger.audit(`${req.user.email} (id: ${req.user.sub}) deactivated user invitation ${user.email} (id: ${user.id})`, {
    //   type: 'support',
    //   subType: 'user-edit',
    //   userId: req.user.sub,
    //   userEmail: req.user.email,
    //   editedUser: user.id,
    //   editedFields: [
    //     {
    //       name: 'status',
    //       oldValue: user.status.id,
    //       newValue: -2,
    //     },
    //   ],
    //   reason: req.body.reason,
    // });

    return res.redirect('services');
  }
};

module.exports = postConfirmDeactivate;
