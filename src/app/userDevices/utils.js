const userDevices = require('./../../infrastructure/userDevices');
const logger = require('./../../infrastructure/logger');
const { getUser } = require('./../../infrastructure/directories');
const { getUserLoginAuditsSince } = require('./../../infrastructure/audit');
const moment = require('moment');
const { mapUserStatus } = require('./../../infrastructure/utils');

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

  const results = await userDevices.search(criteria + '*', page, sortBy, sortAsc);
  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for user devices in support using criteria "${criteria}"`, {
    type: 'support',
    subType: 'userDevice-search',
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
    userDevices: results.userDevices,
    sort: {
      serialNumber: {
        nextDirection: sortBy === 'serialNumber' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'serialNumber',
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
  const successfulLogins = logins.filter(x => x.success).sort((x, y) => {
    const xTime = x.timestamp.getTime();
    const yTime = y.timestamp.getTime();
    if (xTime > yTime) {
      return -1;
    }
    if (xTime < yTime) {
      return 1;
    }
    return 0;
  });

  return {
    id: uid,
    name: `${user.given_name} ${user.family_name}`,
    email: user.email,
    lastLogin: successfulLogins && successfulLogins.length > 0 ? successfulLogins[0].timestamp : null,
    status: mapUserStatus(user.status),
    loginsInPast12Months: {
      successful: successfulLogins ? successfulLogins.length : 0,
    },
  };
};

module.exports = {
  search,
  getUserDetails,
};
