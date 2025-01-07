const { sendResult } = require('../../infrastructure/utils');
const { searchOrganisations } = require('../../infrastructure/organisations');
const logger = require('../../infrastructure/logger');

const validateInput = async (req) => {
  const nameRegEx = /^[^±!@£$%^&*_+§¡€#¢§¶•ªº«\\/<>?:;|=.,~"]{1,60}$/i;
  const model = {
    name: req.body.name || '',
    address: req.body.address || '',
    ukprn: req.body.ukprn || '',
    category: req.body.category || '',
    upin: req.body.upin || '',
    urn: req.body.urn || '',
    validationMessages: {},
  };

  model.name = model.name.trim();
  model.address = model.address.trim();
  model.ukprn = model.ukprn.trim();
  model.category = model.category.trim();
  model.upin = model.upin.trim();
  model.urn = model.urn.trim();

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

  // TODO validate it's a number with x digits
  if (!nameRegEx.test(model.ukprn)) {
    model.validationMessages.ukprn = 'Special characters cannot be used';
  }

  if (!model.category) {
    model.validationMessages.category = 'Please enter a category';
  }

  // TODO validate it's a number with x digits
  if (!nameRegEx.test(model.upin)) {
    model.validationMessages.upin = 'Special characters cannot be used';
  }

  // TODO validate it's a number with x digits
  if (!nameRegEx.test(model.urn)) {
    model.validationMessages.urn = 'Special characters cannot be used';
  }

  return model;
};

const postCreateOrganisation = async (req, res) => {
  const model = await validateInput(req);

  const result = searchOrganisations(model.name, undefined, undefined, 1, req.id);
  console.log(result);
  // TODO validate on name, ukprn, urn and upin to ensure it's unique
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.layout = 'sharedViews/layoutNew.ejs';
    return sendResult(req, res, 'organisations/views/createOrganisation', model);
  }

  req.session.createOrgData = model;

  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error('An error occurred when saving to the session', error);
      model.validationMessages.name = 'Something went wrong submitting data, please try again';
      model.csrfToken = req.csrfToken();
      model.layout = 'sharedViews/layoutNew.ejs';
      return sendResult(req, res, 'organisations/views/createOrganisation', model);
    }
    return res.redirect('confirm-create-org');
  });
};

module.exports = postCreateOrganisation;
