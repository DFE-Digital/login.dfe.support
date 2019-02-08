const { sendResult } = require('./../../infrastructure/utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');

const get = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);

  sendResult(req, res, 'organisations/views/users', {
    organisation: organisation,
    users: [],
  });
};
module.exports = {
  get,
};
