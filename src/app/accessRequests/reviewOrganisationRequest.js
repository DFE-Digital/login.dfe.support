const { getAndMapOrgRequest } = require('./utils');

const get = async (req, res) => {
  const request = await getAndMapOrgRequest(req);
if(req.params.from==='organisation'){
  req._cancelLink = `/users/${request.user_id}/organisations`
}else{
  req._cancelLink = '/access-requests';
}
  return res.render('accessRequests/views/reviewOrganisationRequest', {
    csrfToken: req.csrfToken(),
    title: 'Review request - DfE Sign-in',
    backLink: true,
    cancelLink: req._cancelLink,
    request,
    selectedResponse: null,
    validationMessages: {},
  });
};

const validate = async (req) => {
  const request = await getAndMapOrgRequest(req);
  if(req.params.from==='organisation'){
    req._cancelLink = `/users/${request.user_id}/organisations`;
  }else{
    req._cancelLink = '/access-requests';
  }
  const model = {
    title: 'Review request - DfE Sign-in',
    backLink: true,
    cancelLink:req._cancelLink ,
    request,
    selectedResponse: req.body.selectedResponse,
    validationMessages: {},
  };
  if (model.selectedResponse === undefined || model.selectedResponse === null) {
    model.validationMessages.selectedResponse = 'Approve or Reject must be selected';
  } else if (model.request.approverEmail) {
    model.validationMessages.selectedResponse = `Request already actioned by ${model.request.approverEmail}`;
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('accessRequests/views/reviewOrganisationRequest', model);
  }

  if (model.selectedResponse === 'reject') {
    return res.redirect('reject');
  } else if (model.selectedResponse === 'approve') {
    return res.redirect('approve');
  }
};

module.exports = {
  get,
  post,
};
