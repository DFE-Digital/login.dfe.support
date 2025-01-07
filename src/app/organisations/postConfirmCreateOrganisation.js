const { createOrganisation } = require('../../infrastructure/organisations');
const logger = require('../../infrastructure/logger');

const postCreateOrganisation = async (req, res) => {
  // TODO Do we need to validate again?  Do we just get the data from the session? That
  // way can guarantee it's not been tampered with.

  if (!req.session.createOrgData) {
    return res.redirect('/');
  }

  const model = req.session.createOrgData;

  const body = {
    name: model.name,
    address: model.address,
    ukprn: model.ukprn,
    category: model.category,
    upin: model.upin,
    urn: model.urn,
  };

  await createOrganisation(body, req.id);
  res.flash('info', `Organisation with name ${model.name} successfully created`);
  req.session.createOrgData = undefined;
  return res.redirect('/');
};

module.exports = postCreateOrganisation;
