const { sendResult } = require('./../../infrastructure/utils');
const { deviceExists } = require('./../../infrastructure/devices');

const validateInput = async (req) => {
  const model = {
    serialNumber: req.body.serialNumber,
    cleanSerialNumber: req.body.serialNumber ? req.body.serialNumber.replace(/\-/g, '') : '',
    isValid: true,
    validationMessages: {},
  };

  const numericSerialNumber = model.serialNumber ? parseInt(model.cleanSerialNumber) : 0;
  if (!model.serialNumber) {
    model.isValid = false;
    model.validationMessages.serialNumber = 'You must supply a token serial number';
  } else if (model.cleanSerialNumber.length !== 10 || isNaN(numericSerialNumber) || numericSerialNumber.toString().length !== 10) {
    model.isValid = false;
    model.validationMessages.serialNumber = 'Serial number must be 10 digits (excluding hyphens)';
  } else if (!await deviceExists(model.serialNumber, req.id)) {
    model.isValid = false;
    model.validationMessages.serialNumber = 'Serial number does not exist';
  }

  return model;
};

const postAssignDigipass = async (req, res) => {
  if (!req.session.k2sUser) {
    return res.redirect('../');
  }

  const validationResult = await validateInput(req);
  if (!validationResult.isValid) {
    validationResult.csrfToken = req.csrfToken();
    validationResult.user = req.session.k2sUser;
    return sendResult(req, res, 'users/views/assignDigipass', validationResult);
  }

  req.session.digipassSerialNumberToAssign = validationResult.cleanSerialNumber;
  return res.redirect('confirm-new-k2s-user');
};

module.exports = postAssignDigipass;
