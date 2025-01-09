const { createOrganisation } = require('../../infrastructure/organisations');
const logger = require('../../infrastructure/logger');

const postCreateOrganisation = async (req, res) => {
  const correlationId = req.id;
  if (!req.session.createOrgData) {
    return res.redirect('/organisations');
  }

  const model = req.session.createOrgData;
  const body = {
    name: model.name,
    address: model.address,
    ukprn: model.ukprn,
    category: {
      id: model.category,
    },
    upin: model.upin,
    urn: model.urn,
  };

  logger.info(`About to create organisation with name ${model.name}`, { correlationId });
  await createOrganisation(body, correlationId);
  logger.info(`Organisation with name ${model.name} successfully created`, { correlationId });
  res.flash('info', `Organisation with name '${model.name}' successfully created`);

  req.session.createOrgData = undefined;
  return res.redirect('/organisations');
};

module.exports = postCreateOrganisation;
