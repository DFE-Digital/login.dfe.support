const logger = require('./../../infrastructure/logger');
const { getAllAuditsSince, cache } = require('./../../infrastructure/audit');

const getOrAddUpdate = async (userId, updates) => {
  let update = updates.find(u => u.userId.toLowerCase() === userId.toLowerCase());
  if (!update) {
    update = await cache.getStatsForUser(userId);
    if (!update) {
      update = {
        userId: userId,
        loginsInPast12Months: [],
        lastLogin: undefined,
        lastStatusChange: undefined,
      };
    }
    updates.push(update);
  }
  return update;
};
const addOrUpdateSigninDetails = async (auditRecord, updates) => {
  if (!auditRecord.userId || auditRecord.type !== 'sign-in' || auditRecord.subType !== 'username-password') {
    return;
  }

  const update = await getOrAddUpdate(auditRecord.userId, updates);

  if (!update.lastLogin || auditRecord.timestamp.getTime() > update.lastLogin.getTime()) {
    update.lastLogin = auditRecord.timestamp;
  }

  update.loginsInPast12Months.push({
    timestamp: auditRecord.timestamp,
  });
};
const addOrUpdateChangeDetails = async (auditRecord, updates) => {
  if (auditRecord.type !== 'support' || auditRecord.subType !== 'user-edit'
    || !auditRecord.editedUser || ! auditRecord.editedFields.find(y => y.name === 'status')) {
    return;
  }

  const update = await getOrAddUpdate(auditRecord.editedUser, updates);

  if (!update.lastStatusChange || auditRecord.timestamp.getTime() > update.lastStatusChange.getTime()) {
    update.lastStatusChange = auditRecord.timestamp;
  }
};
const addOrUpdateForBatch = async (auditRecord, updates) => {
  await addOrUpdateSigninDetails(auditRecord, updates);
  await addOrUpdateChangeDetails(auditRecord, updates);
};
const tidyUpdatesOfOldData = (updates) => {
  if (!updates || updates.length === 0) {
    return;
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  updates.forEach((update) => {
    const loginsInPast12Months = update.loginsInPast12Months.filter(x => x.timestamp.getTime() >= twelveMonthsAgo.getTime());
    update.loginsInPast12Months = loginsInPast12Months;
  });
};

const syncAuditCache = async () => {
  let hasMoreAuditRecords = true;
  let dateOfLastAuditRecord = await cache.getDateOfLastAuditRecord();
  while (hasMoreAuditRecords) {
    logger.info(`Reading batch of audits since ${dateOfLastAuditRecord}`);
    const batch = await getAllAuditsSince(dateOfLastAuditRecord);
    if (batch.length > 0) {
      logger.info(`Parsing batch of ${batch.length} for updates`);
      const updates = [];
      for (let i = 0; i < batch.length; i += 1) {
        const auditRecord = batch[i];
        await addOrUpdateForBatch(auditRecord, updates);
      }
      tidyUpdatesOfOldData(updates);
      await cache.update(updates);
      logger.info(`Updated cache with ${updates.length} updates`);

      dateOfLastAuditRecord = batch[batch.length - 1].timestamp;
      await cache.setDateOfLastAuditRecord(dateOfLastAuditRecord);
      logger.info(`Updated cache with last audit date of ${dateOfLastAuditRecord}`);
    } else {
      hasMoreAuditRecords = false;
    }
  }
  logger.info('Finished updating audit cache');
};

module.exports = syncAuditCache;
