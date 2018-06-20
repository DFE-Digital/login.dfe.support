'use strict';
const { sendResult } = require('./../../infrastructure/utils');
const { getById, putUserInOrganisation } = require('./utils');

const get = async (req, res) => {
  const accessRequest = await getById(req);

  const model = {
    accessRequest,
    csrfToken: req.csrfToken(),
  };

  sendResult(req, res, 'accessRequests/views/request', model);
};

const post = async (req, res) => {

  await putUserInOrganisation(req);

  if(req.body.approve_reject.toLowerCase() === 'approve') {
    res.flash('info', `Access request approved. ${req.body.name} is now associated with ${req.body.org_name}`);
  } else {
    res.flash('info', `Access request rejected. ${req.body.name} has been rejected and audited.`);
  }

  res.redirect('/access-requests');
};

module.exports = {
  get,
  post,
};