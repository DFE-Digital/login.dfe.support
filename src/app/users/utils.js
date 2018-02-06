const users = require('./../../infrastructure/users');
const logger = require('./../../infrastructure/logger');
const { getUser } = require('./../../infrastructure/directories');
const { getUserLoginAuditsSince, getUserChangeHistory } = require('./../../infrastructure/audit');
const moment = require('moment');
const { mapUserStatus } = require('./../../infrastructure/utils');

const auditSorter = (x, y) => {
  const xTime = x.timestamp.getTime();
  const yTime = y.timestamp.getTime();
  if (xTime > yTime) {
    return -1;
  }
  if (xTime < yTime) {
    return 1;
  }
  return 0;
};

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

  let sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'name';
  let sortAsc = (paramsSource.sortdir ? paramsSource.sortdir : 'asc').toLowerCase() === 'asc';

  const results = await users.search(criteria + '*', page, sortBy, sortAsc);
  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for users in support using criteria "${criteria}"`, {
    type: 'support',
    subType: 'user-search',
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
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users,
    sort: {
      name: {
        nextDirection: sortBy === 'name' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'name',
      },
      email: {
        nextDirection: sortBy === 'email' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'email',
      },
      organisation: {
        nextDirection: sortBy === 'organisation' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'organisation',
      },
      lastLogin: {
        nextDirection: sortBy === 'lastlogin' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'lastlogin',
      },
    }
  };
};

const getUserDetails = async (req) => {
  const uid = req.params.uid;
  const user = await getUser(uid);
  const logins = (await getUserLoginAuditsSince(uid, moment().subtract(1, 'years').toDate())).map(x => {
    x.timestamp = new Date(x.timestamp);
    return x;
  });
  const successfulLogins = logins.filter(x => x.success).sort(auditSorter);

  const userChangeHistory = await getUserChangeHistory(uid, 1);
  const statusChanges = userChangeHistory.audits.filter(x => x.editedFields && x.editedFields.find(y => y.name === 'status')).sort(auditSorter);
  const statusLastChangedOn = statusChanges && statusChanges.length > 0 ? new Date(statusChanges[0].timestamp) : null;

  return {
    id: uid,
    name: `${user.given_name} ${user.family_name}`,
    firstName: user.given_name,
    lastName: user.family_name,
    email: user.email,
    lastLogin: successfulLogins && successfulLogins.length > 0 ? successfulLogins[0].timestamp : null,
    status: mapUserStatus(user.status, statusLastChangedOn),
    loginsInPast12Months: {
      successful: successfulLogins ? successfulLogins.length : 0,
    },
  };
};

module.exports = {
  search,
  getUserDetails,
};
