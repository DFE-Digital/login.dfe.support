const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const { chunk } = require('lodash');
const moment = require('moment');
const { getUser } = require('./../../infrastructure/directories');

const pageSize = 25;

const tls = config.audit.params.connectionString.includes('6380');
const client = redis.createClient({
  url: config.audit.params.connectionString,
  tls,
});
const lrangeAsync = promisify(client.lrange).bind(client); //lrange(indexname, start, stop)

const getPageOfAudits = async (pageNumber) => {
  const pageSize = 200;
  const start = (pageNumber - 1) * pageSize;
  const stop = start + pageSize - 1;

  const range = await lrangeAsync('winston', start, stop);
  if (!range || range.length === 0) {
    return [];
  }

  return range.map((record) => {
    return JSON.parse(record);
  });
};

const getUserAudit = async (userId, pageNumber) => {
  const records = [];

  let redisPageNumber = 1;
  while (true) {
    const redisPage = await getPageOfAudits(redisPageNumber);
    if (!redisPage || redisPage.length === 0) {
      break; // Run out of records in redis
    }

    for (let i = 0; i < redisPage.length; i++) {
      const record = redisPage[i];
      if ((record.userId && record.userId === userId) || (record.editedUser && record.editedUser === userId)) {
        records.push(record);
      }
    }

    redisPageNumber++;
  }

  const pages = chunk(records, pageSize);
  const page = pageNumber <= pages.length ? pages[pageNumber - 1] : [];
  return {
    audits: page,
    numberOfPages: pages.length,
    numberOfRecords: records.length,
  };
};

const getUserLoginAuditsSince = async (userId, sinceDate) => {
  const since = moment(sinceDate);
  const loginAudits = [];

  let pageNumber = 1;
  let hasMorePages = true;
  while (hasMorePages) {
    const page = await getUserAudit(userId, pageNumber);
    page.audits.forEach((audit) => {
      if (audit.type === 'sign-in' && audit.userId === userId && moment(audit.timestamp).isAfter(since)) {
        loginAudits.push(audit);
      }
    });

    pageNumber++;
    hasMorePages = pageNumber <= page.numberOfPages;
  }

  return loginAudits;
};

const getUserName = async(userId) => {
  const user = await getUser(userId);

  return `${user.given_name} ${user.family_name}`;
};

const getTokenAudits = async (userId, serialNumber, pageNumber, userName) => {
  const requiredAudits = pageNumber * pageSize;
  let loginAudits = [];

  let p = 1;
  let hasMorePages = true;
  while (hasMorePages && loginAudits.length < requiredAudits) {
    const pageOfAudits = await getUserAudit(userId, p);
     let loginAuditsPage = await Promise.all(pageOfAudits.audits.filter((audit) =>  {
       return (audit.deviceSerialNumber === serialNumber)}).map(async (audit) => {
         audit.date = new Date(audit.timestamp);
         audit.name = audit.userId === userId ? userName : await getUserName(audit.userId);
         audit.success = audit.success ? 'Success' : 'Failure';

        if(audit.type==='support' && audit.subType === 'digipass-resync') {
          audit.event = 'Login';
        } else if(audit.type==='sign-in' && audit.subType==='digipass') {
          audit.event = 'Resync';
        } else {
          audit.event = $`Digipass event ${audit.type} - ${audit.subType}`;
        }
        return audit;
    }));
    loginAudits.push(...loginAuditsPage);
    p++;
    hasMorePages = p <= pageOfAudits.numberOfPages;
  }

  const pages = chunk(loginAudits, pageSize);
  const page = pageNumber <= pages.length ? pages[pageNumber - 1] : [];
  return {
    audits: page,
    numberOfPages: pages.length,
  };
};

const getUserLoginAuditsForService = async (userId, clientId, pageNumber) => {
  const requiredAudits = pageNumber * pageSize;
  const loginAudits = [];

  let p = 1;
  let hasMorePages = true;
  while (hasMorePages && loginAudits.length < requiredAudits) {
    const pageOfAudits = await getUserAudit(userId, p);
    pageOfAudits.audits.forEach((audit) => {
      if (audit.type === 'sign-in' && audit.userId === userId && audit.clientId === clientId) {
        loginAudits.push(audit);
      }
    });

    p++;
    hasMorePages = p <= pageOfAudits.numberOfPages;
  }

  const pages = chunk(loginAudits, pageSize);
  const page = pageNumber <= pages.length ? pages[pageNumber - 1] : [];
  return {
    audits: page,
    numberOfPages: pages.length, // This will create a moving number of pages. Current use case will work, but may need re-thinking
  };
};

const getUserChangeHistory = async (userId, pageNumber) => {
  const requiredAudits = pageNumber * pageSize;
  const audits = [];

  let p = 1;
  let hasMorePages = true;
  while (hasMorePages && audits.length < requiredAudits) {
    const pageOfAudits = await getUserAudit(userId, p);
    pageOfAudits.audits.forEach((audit) => {
      if (audit.type === 'support' && audit.subType === 'user-edit' && audit.editedUser === userId) {
        audits.push(audit);
      }
    });

    p++;
    hasMorePages = p <= pageOfAudits.numberOfPages;
  }

  const pages = chunk(audits, pageSize);
  const page = pageNumber <= pages.length ? pages[pageNumber - 1] : [];
  return {
    audits: page,
    numberOfPages: pages.length, // This will create a moving number of pages. Current use case will work, but may need re-thinking
  };
};

module.exports = {
  getUserAudit,
  getUserLoginAuditsSince,
  getUserLoginAuditsForService,
  getUserChangeHistory,
  getTokenAudits,
};
