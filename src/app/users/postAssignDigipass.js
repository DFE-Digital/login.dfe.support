const { sendResult } = require('./../../infrastructure/utils');

const validateInput = (req) => {
  const model = {
    serialNumber: req.body.serialNumber,
    cleanSerialNumber: req.body.serialNumber ? req.body.serialNumber.replace(/\-/g, '') : '',
    isValid: true,
    validationMessages: {},
  };

  if (!model.serialNumber) {
    model.isValid = false;
    model.validationMessages.serialNumber = 'You must supply a token serial number';
  } else {
    const numericSerialNumber = parseInt(model.cleanSerialNumber);
    if (model.cleanSerialNumber.length !== 10 || isNaN(numericSerialNumber) || numericSerialNumber.toString().length !== 10) {
      model.isValid = false;
      model.validationMessages.serialNumber = 'Serial number must be 10 digits (excluding hyphens)';
    }
  }

  return model;
};

const postAssignDigipass = (req, res) => {
  if (!req.session.k2sUser) {
    return res.redirect('../');
  }

  const validationResult = validateInput(req);
  if (!validationResult.isValid) {
    validationResult.csrfToken = req.csrfToken();
    validationResult.user = req.session.k2sUser;
    return sendResult(req, res, 'users/views/assignDigipass', validationResult);
  }

  req.session.digipassSerialNumberToAssign = validationResult.cleanSerialNumber;
  return res.redirect('confirm-new-k2s-user');
};

module.exports = postAssignDigipass;
