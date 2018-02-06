const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const { chunk } = require('lodash');
const moment = require('moment');

const pageSize = 25;

const client = redis.createClient({
  url: config.audit.params.connectionString,
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
      if (record.userId && record.userId === userId) {
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
  const page = pageNumber < pages.length ? pages[pageNumber - 1] : [];
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
    const pageOfAudits = await getPageOfAudits(p);
    pageOfAudits.forEach((audit) => {
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
};
