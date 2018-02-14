const { createInvite } = require('./../../infrastructure/directories');
const { addInvitationService } = require('./../../infrastructure/organisations');
const config = require('./../../infrastructure/config');
const logger = require('./../../infrastructure/logger');

const postConfirmNewK2sUser = async (req, res) => {
  if (!req.session.k2sUser || !req.session.digipassSerialNumberToAssign) {
    return res.redirect('../');
  }

  const invitationId = await createInvite(req.session.k2sUser.firstName, req.session.k2sUser.lastName, req.session.k2sUser.email, req.session.k2sUser.k2sId, req.session.digipassSerialNumberToAssign, req.id);
  await addInvitationService(invitationId, req.session.k2sUser.localAuthority, config.serviceMapping.key2SuccessServiceId, 0, req.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) invited ${req.session.k2sUser.email} to user key-to-success. Key-to-Success id: ${req.session.k2sUser.k2sId}, Digipass: ${req.session.digipassSerialNumberToAssign}`,
    {
      type: 'support',
      subType: 'user-invite',
      userId: req.user.sub,
      userEmail: req.user.email,
      invitedUserEmail: req.session.k2sUser.email,
      invitedUserK2SId: req.session.k2sUser.k2sId,
      invitedUserDigipass: req.session.digipassSerialNumberToAssign,
    });

  res.flash('info', `${req.session.k2sUser.firstName} ${req.session.k2sUser.lastName} has been invited to join Key to Success.`);
  console.log('set flash');
  return res.redirect('/users');
};

module.exports = postConfirmNewK2sUser;
