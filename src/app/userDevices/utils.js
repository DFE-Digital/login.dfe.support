const userDevices = require('./../../infrastructure/userDevices');
const logger = require('./../../infrastructure/logger');
const { getUserLoginAuditsSince, getTokenAudits } = require('./../../infrastructure/audit');
const moment = require('moment');

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

const getUserTokenDetails = async (req, params) => {
  const uid = params.uid;
  const serialNumber = params.serialNumber;

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

  const result = await userDevices.getByUserId(uid);
  let auditRecords = [];
  if(result) {
    auditRecords = await getTokenAudits(uid, serialNumber, 1, result.name);
  }

  logger.audit(`${req.user.email} (id: ${req.user.sub}) viewed users device userId:${uid} ${req.user.email} in support`, {
    type: 'support',
    subType: 'userDevice-detail',
    userId: req.user.sub,
    userEmail: req.user.email,
  });



  return {
    uid: uid,
    name: result.name,
    serialNumber: result.device.serialNumber,
    serialNumberFormatted: result.device.serialNumberFormatted,
    tokenStatus :  result.name ? 'Active' : 'Unassigned',
    orgName: result.organisation ? result.organisation.name : '',
    email: result.email,
    lastLogin: successfulLogins && successfulLogins.length > 0 ? successfulLogins[0].timestamp : null,
    numberOfSuccessfulLoginAttemptsInTwelveMonths:  successfulLogins ? successfulLogins.length : 0,
    audit: auditRecords,
  };
};

module.exports = {
  search,
  getUserTokenDetails,
};
