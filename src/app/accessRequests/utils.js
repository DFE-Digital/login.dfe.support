const logger = require('./../../infrastructure/logger');
const config = require('./../../infrastructure/config');
const accessRequests = require('../../infrastructure/accessRequests');
const organisations = require('./../../infrastructure/organisations');
const NotificationClient = require('login.dfe.notifications.client');

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;

  let criteria = paramsSource.criteria;
  if (!criteria) {
    criteria = '';
  }

  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  let sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'createddate';
  let sortAsc = (paramsSource.sortdir ? paramsSource.sortdir : 'asc').toLowerCase() === 'asc';

  const results = await accessRequests.search(criteria + '*', page, sortBy, sortAsc);
  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for access requests in support using criteria "${criteria}"`, {
    type: 'support',
    subType: 'accessRequest-search',
    userId: req.user.sub,
    userEmail: req.user.email,
    criteria: criteria,
    pageNumber: page,
    numberOfPages: results.numberOfPages,
    sortedBy: sortBy,
    sortDirection: sortAsc ? 'asc' : 'desc',
  });

  return {
    criteria,
    page,
    sortBy,
    sortOrder: sortAsc ? 'asc' : 'desc',
    numberOfPages: results.totalNumberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    accessRequests: results.accessRequests,
    sort: {
      organisation: {
        nextDirection: sortBy === 'organisation' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'organisation',
      },
      email: {
        nextDirection: sortBy === 'email' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'email',
      },
      name: {
        nextDirection: sortBy === 'name' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'name',
      },
      createdDate: {
        nextDirection: sortBy === 'createddate' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'createddate',
      },
    }
  };
};

const getById = async (req) => {
  const id = `${req.params.id}`;

  return await accessRequests.getById(id)
};

const putUserInOrganisation = async (req) => {
  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });

  const id = `${req.body.userOrgId}`;

  await accessRequests.deleteAccessRequest(id);

  const userId = req.body.user_id;
  const orgId = req.body.org_id;
  const status = req.body.approve_reject.toLowerCase() === 'approve' ? 1 : -1;
  let role = 0;
  let reason = req.body.message;

  if(status === 1) {
    reason = '';
    role = req.body.role.toLowerCase() === 'approver' ? 10000 : 1;
  }

  await organisations.setUserAccessToOrganisation(userId,orgId, role, req.id, status, reason );

  if(req.body.email) {
    await notificationClient.sendAccessRequest(req.body.email,req.body.name,req.body.org_name,status===1,reason);
  }


  logger.audit(`User ${req.user.email} (id: ${req.user.sub}) has set set user id ${userId} to status "${req.body.approve_reject}"`, {
    type: 'organisation',
    subType: 'access-request-support',
    success: true,
    editedUser: userId,
    userId: req.user.sub,
    userEmail: req.user.email,
    role: role,
    reason,
    orgId,
    status: req.body.approve_reject
  });
};

module.exports = {
  search,
  getById,
  putUserInOrganisation,
};