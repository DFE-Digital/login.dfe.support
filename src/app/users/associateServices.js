'use strict';
const { getUserOrganisations } = require('./../../infrastructure/organisations');

const get = async (req, res) => {
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);

  res.render('users/views/associateServices')
};

module.exports = {
  get,
};
