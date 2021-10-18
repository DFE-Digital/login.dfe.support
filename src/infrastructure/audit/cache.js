const Redis = require('ioredis');
const { queue } = require('async');
const config = require('./../config');

const redis = new Redis(config.audit.cacheConnectionString);
let dateOfLastAuditUpdate = new Date(2018, 0, 1);
const userStats = [];

const readUserStatsFromStore = async () => {
  return new Promise((resolve, reject) => {
    const q = queue(async (key) => {
      const hash = await redis.hgetall(key);
      const user = {
        userId: hash.userId,
        lastLogin: hash.lastLogin > 0 ? new Date(parseInt(hash.lastLogin)) : undefined,
        loginsInPast12Months: JSON.parse(hash.loginsInPast12Months).map((login) => {
          const mapped = Object.assign({}, login);
          mapped.timestamp = new Date(login.timestamp);
          return mapped;
        }),
        lastStatusChange: hash.lastStatusChange > 0 ? new Date(parseInt(hash.lastStatusChange)) : undefined
      };
      userStats.push(user);
    }, 1);

    const stream = redis.scanStream({ match: 'User_*' });
    stream.on('data', (keys) => {
      q.push(keys, (err) => {
        if (err) {
          q.kill();
          reject(err);
        }
      });
    });
    stream.on('end', () => {
      q.drain = () => {
        resolve();
      };
    })
  });
};

const init = async () => {
  const lastAuditPointer = await redis.get('DateOfLastAuditUpdate');
  if (lastAuditPointer) {
    const time = parseInt(lastAuditPointer);
    dateOfLastAuditUpdate = new Date(time);
  }

  await readUserStatsFromStore();
};

const getDateOfLastAuditRecord = async () => {
  return Promise.resolve(dateOfLastAuditUpdate);
};
const setDateOfLastAuditRecord = async (date) => {
  dateOfLastAuditUpdate = date;

  await redis.set('DateOfLastAuditUpdate', dateOfLastAuditUpdate.getTime().toString());
};
const update = async (updates) => {
  if (!updates || updates.length === 0) {
    return;
  }

  for (let i = 0; i < updates.length; i += 1) {
    const update = updates[i];

    // Persist in redis
    const loginsInPast12Months = update.loginsInPast12Months.map((login) => {
      const mapped = Object.assign({}, login);
      mapped.timestamp = login.timestamp.getTime();
      return mapped;
    });
    await redis.hmset(`User_${update.userId.toLowerCase()}`, {
      userId: update.userId,
      loginsInPast12Months: JSON.stringify(loginsInPast12Months),
      lastLogin: update.lastLogin ? update.lastLogin.getTime() : 0,
      lastStatusChange: update.lastStatusChange ? update.lastStatusChange.getTime() : 0,
    });

    // Update in memory
    let stats = userStats.find(u => u.userId.toLowerCase() === update.userId.toLowerCase());
    if (!stats) {
      stats = { userId: update.userId };
      userStats.push(stats);
    }
    stats.loginsInPast12Months = update.loginsInPast12Months;
    stats.lastLogin = update.lastLogin;
    stats.lastStatusChange = update.lastStatusChange;
  }

  return Promise.resolve();
};
const getStatsForUser = async (userId) => {
  let stats = userStats.find(u => u.userId.toLowerCase() === userId.toLowerCase());
  return Promise.resolve(stats);
};

const getAuditRefreshStatus = () => redis.get('AuditRefreshInProgress');

module.exports = {
  init,
  getDateOfLastAuditRecord,
  setDateOfLastAuditRecord,
  update,
  getStatsForUser,
  getAuditRefreshStatus,
};
