'use strict';
const { sendResult } = require('./../../infrastructure/utils');
const { getById } = require('./utils');

const get = async (req, res) => {
  const accessRequest = await getById(req);

  const model = {
    accessRequest,
    csrfToken: req.csrfToken(),
  };

  sendResult(req, res, 'accessRequests/views/request', model);
};

module.exports = {
  get,
};