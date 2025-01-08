const { sendResult } = require('../../infrastructure/utils');
const { searchOrganisations } = require('../../infrastructure/organisations');
const logger = require('../../infrastructure/logger');

const validateInput = async (req) => {

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

  const nameRegEx = /^[^±!@£$%^*_+§¡€#¢§¶•ªº«\\/<>:;|=.~"]+$/i;
  if (!model.name) {
    model.validationMessages.name = 'Please enter a name';
  } else if (!nameRegEx.test(model.name)) {
    model.validationMessages.name = 'Special characters cannot be used';
  } else if (model.name.length > 255) {
    model.validationMessages.name = 'Name cannot be longer than 255 characters';
  }

  if (model.address) {
    const addressRegex = /^[^±!@£$%^*_+§¡€#¢§¶•ªº«\\/<>:;|=.~"]+$/i;
    if (!addressRegex.test(model.address)) {
      model.validationMessages.address = 'Special characters cannot be used';
    }
  }

  if (model.ukprn) {
    const ukprnRegex = /^\d{8}$/i;
    if (!ukprnRegex.test(model.ukprn)) {
      model.validationMessages.ukprn = 'UKPRN can only an 8 digit number';
    }
  }

  if (!model.category) {
    model.validationMessages.category = 'Please enter a category';
  }

  if (model.upin) {
    const upinRegex = /^\d{6}$/i;
    if (!upinRegex.test(model.upin)) {
      model.validationMessages.upin = 'UPIN can only an 6 digit number';
    }
  }

  if (model.urn) {
    const urnRegex = /^\d{6}$/i;
    if (!urnRegex.test(model.urn)) {
      model.validationMessages.urn = 'URN can only an 6 digit number';
    }
  }

  return model;
};

const postCreateOrganisation = async (req, res) => {
  const model = await validateInput(req);

  if (Object.keys(model.validationMessages).length === 0) {
    // Validate no duplicate organisations exist.  Currently the validation is a bit of a blunt
    // tool as the search just searches if ANY field matches the value (123 could find an org with a
    // name of '123 test' as well as one with a UKPRN of 123). It's possible for false positives to
    // happen, so we'll have to improve this on a future iteration.  We MUST do some validation
    // because the create org endpoint will update an organisation with the provided information
    // if it already exists, so a false positive is the preferred result.
    if (model.ukprn) {
      const ukprnResult = await searchOrganisations(model.ukprn, undefined, undefined, 1, req.id);
      if (ukprnResult.totalNumberOfRecords > 0) {
        model.validationMessages.ukprn = 'An organisation with this UKPRN already exists';
      }
    }

    if (model.urn) {
      const urnResult = await searchOrganisations(model.urn, undefined, undefined, 1, req.id);
      if (urnResult.totalNumberOfRecords > 0) {
        model.validationMessages.urn = 'An organisation with this URN already exists';
      }
    }
  }

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.currentPage = 'organisations';
    model.layout = 'sharedViews/layoutNew.ejs';
    model.backLink = true;
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
      model.currentPage = 'organisations';
      model.layout = 'sharedViews/layoutNew.ejs';
      model.backLink = true;
      return sendResult(req, res, 'organisations/views/createOrganisation', model);
    }
    return res.redirect('confirm-create-org');
  });
};

module.exports = postCreateOrganisation;
