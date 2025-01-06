const { sendResult } = require('../../infrastructure/utils');

const validateInput = async (req) => {
  const nameRegEx = /^[^±!@£$%^&*_+§¡€#¢§¶•ªº«\\/<>?:;|=.,~"]{1,60}$/i;
  const model = {
    name: req.body.name || '',
    address: req.body.address || '',
    validationMessages: {},
    layout: 'sharedViews/layoutNew.ejs',
  };

  if (!model.name) {
    model.validationMessages.name = 'Please enter a name';
  } else if (!nameRegEx.test(model.name)) {
    model.validationMessages.name = 'Special characters cannot be used';
  }

  if (!model.address) {
    model.validationMessages.address = 'Please enter an address';
  } else if (!nameRegEx.test(model.address)) {
    model.validationMessages.address = 'Special characters cannot be used';
  }

  return model;
};

const postCreateOrganisation = async (req, res) => {
  const model = await validateInput(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return sendResult(req, res, 'organisations/views/createOrganisation', model);
  }

  console.log('Hit organisation API to create org');
  return res.redirect('/organisations');
};

module.exports = postCreateOrganisation;
