const { createDevice } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const postConfirmAssignToken = async (req, res) => {
  if (!req.body.userId || !req.body.serialNumber) {
    return res.redirect('../');
  }

  const result = await createDevice(req);

  if(!result) {
    sendResult(req, res, 'users/views/assignDigipass', {
      csrfToken: req.csrfToken(),
      validationMessages: {
        error: 'Failed to assign token to user',
      },
      uid: req.body.userId,
      serialNumber: req.body.serialNumber,
    });
  }

  res.flash('info', `New token assigned Token ${req.session.digipassSerialNumberToAssign} has been assigned to this user.`);
  return res.redirect(`/users/${req.body.userId}/services`);
};

module.exports = postConfirmAssignToken;
