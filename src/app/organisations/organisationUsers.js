const { sendResult } = require('./../../infrastructure/utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');
const { seachForUsers } = require('./../../infrastructure/search');

const mapRole = (roleId) => {
  if (roleId === 10000) {
    return { id: 10000, description: 'Approver' };
  }
  return { id: 1, description: 'End User' };
};
const render = async (req, res, dataSource) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  let pageNumber = dataSource.page ? parseInt(dataSource.page) : 1;
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }

  const results = await seachForUsers('*', pageNumber, undefined, undefined, {
    organisations: [organisation.id],
  });

  const users = results.users.map((user) => {
    const viewUser = Object.assign({}, user);
    viewUser.organisation = Object.assign({}, user.organisations.find(o => o.id.toUpperCase() === organisation.id.toUpperCase()));
    viewUser.organisation.role = mapRole(viewUser.organisation.roleId);
    return viewUser;
  });

  sendResult(req, res, 'organisations/views/users', {
    csrfToken: req.csrfToken(),
    organisation: organisation,
    users,
    page: pageNumber,
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
  });
};

const get = async (req, res) => {
  return render(req, res, req.query);
};
const post = async (req, res) => {
  return render(req, res, req.body);
};
module.exports = {
  get,
  post,
};
