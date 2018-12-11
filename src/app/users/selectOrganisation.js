'use strict';

const { getUserOrganisations } = require('./../../infrastructure/organisations');

const getNaturalIdentifiers = async (req) => {
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);
  for (let i= 0; i < userOrganisations.length; i++) {
    const org = userOrganisations[i];
    if (org.organisation) {
      org.naturalIdentifiers = [];
      const urn = org.organisation.urn;
      const uid = org.organisation.uid;
      const ukprn = org.organisation.ukprn;
      if (urn) {
        org.naturalIdentifiers.push(`URN: ${urn}`)
      }
      if (uid) {
        org.naturalIdentifiers.push(`UID: ${uid}`)
      }
      if (ukprn) {
        org.naturalIdentifiers.push(`UKPRN: ${ukprn}`)
      }
    }
  }
  return userOrganisations;
};

const get = async (req, res) => {
  const userOrganisations = await getNaturalIdentifiers(req);
  if (userOrganisations.length === 1) {
    return res.redirect(`organisations/${userOrganisations[0].organisation.id}`);
  }
  return res.render('users/views/selectOrganisation', {
    csrfToken: req.csrfToken(),
    organisations: userOrganisations,
    selectedOrganisation: null,
    validationMessages: {},
  });
};

const validate = async (req) => {
  const userOrganisations = await getNaturalIdentifiers(req);
  const selectedOrg = req.body.selectedOrganisation;
  const model = {
    selectedOrganisation: selectedOrg,
    validationMessages: {},
    organisations: userOrganisations,
  };

  if (model.selectedOrganisation === undefined || model.selectedOrganisation === null) {
    model.validationMessages.selectedOrganisation = 'Please select an organisation'
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('users/views/selectOrganisation', model);
  }
  return res.redirect(`/users/${req.params.uid}/organisations/${model.selectedOrganisation}`);
};


module.exports = {
  get,
  post,
};