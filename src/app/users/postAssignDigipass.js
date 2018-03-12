const { sendResult } = require('./../../infrastructure/utils');
const { deviceExists } = require('./../../infrastructure/devices');
const { getUserAssociatedToDevice } = require('./../../infrastructure/directories');

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
  } else if (!await deviceExists(model.cleanSerialNumber, req.id)) {
    model.isValid = false;
    model.validationMessages.serialNumber = 'Serial number does not exist';
  } else if (await getUserAssociatedToDevice('digipass', model.cleanSerialNumber, req.id)) {
    model.isValid = false;
    model.validationMessages.serialNumber = 'Serial number is already assigned to another user';
  }

  return model;
};

const postAssignDigipass = async (req, res) => {

  let user;
  let isExistingUser = false;
  if (req.session.k2sUser) {
    user = req.session.k2sUser;
  }
  if(req.session.user) {
    user = req.session.user;
    isExistingUser = true;
  }

  if(!user) {
    return res.redirect('../');
  }

  const validationResult = await validateInput(req);
  if (!validationResult.isValid) {
    validationResult.csrfToken = req.csrfToken();
    validationResult.user = user;
    return sendResult(req, res, 'users/views/assignDigipass', validationResult);
  }

  req.session.digipassSerialNumberToAssign = validationResult.cleanSerialNumber;

  if(isExistingUser) {
    return res.redirect(`/users/${user.id}/assign-digipass/${user.serviceId}/confirm`)
  }
  return res.redirect('confirm-new-k2s-user');
};

module.exports = postAssignDigipass;
