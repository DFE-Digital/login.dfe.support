const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const { chunk } = require('lodash');
const moment = require('moment');

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
  const pageSize = 25;
  const requiredRecords = (pageNumber + 1) * pageSize;
  const records = [];

  let redisPageNumber = 1;
  while (records.length < requiredRecords) {
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
  const page = pageNumber < pages.length ? pages[pageNumber - 1] : [];
  return {
    audits: page,
    numberOfPages: pages.length, // This will create a moving number of pages. Current use case will work, but may need re-thinking
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

module.exports = {
  getUserAudit,
  getUserLoginAuditsSince,
};
