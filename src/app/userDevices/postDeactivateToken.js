const { deactivateToken } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {

  const result = await deactivateToken(req);

  if(!result) {
    sendResult(req, res, 'userDevices/views/deactivateToken', {
      csrfToken: req.csrfToken(),
      uid: req.params.uid,
      serialNumber: req.params.serialNumber,
      validationMessages: {
        deactivateFailed: 'Unable to deactivate token'
      },
    });
  }
  else {

    res.flash('info', 'Deactivate complete - Token has been deactivated');
    res.redirect('/userDevices')
  }

};

module.exports = action;
