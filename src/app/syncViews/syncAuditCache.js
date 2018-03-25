const logger = require('./../../infrastructure/logger');
const { getAllAuditsSince, cache } = require('./../../infrastructure/audit');

const addOrUpdateForBatch = (auditRecord, updates) => {
  if (!auditRecord.userId) {
    return;
  }

  let update = updates.find(u => u.userId.toLowerCase() === auditRecord.userId.toLowerCase());
  let requiresAdding = false;
  if (!update) {
    update = {
      userId: auditRecord.userId,
      loginsInPast12Months: [],
      lastLogin: undefined,
    };
    requiresAdding = true;
  }

  let hasBeenUpdated = false;

  // Update with login details
  if (auditRecord.type === 'sign-in' && auditRecord.subType === 'username-password') {
    if (!update.lastLogin || auditRecord.timestamp.getTime() > update.lastLogin.getTime()) {
      update.lastLogin = auditRecord.timestamp;
    }

    update.loginsInPast12Months.push({
      timestamp: auditRecord.timestamp,
    });

    hasBeenUpdated = true;
  }

  // Tidy record of old data
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const loginsInPast12Months = update.loginsInPast12Months.filter(x => x.timestamp.getTime() >= twelveMonthsAgo.getTime());
  if (loginsInPast12Months.length !== update.loginsInPast12Months.length) {
    update.loginsInPast12Months = loginsInPast12Months;
    hasBeenUpdated = true;
  }

  if (hasBeenUpdated && requiresAdding) {
    updates.push(update);
  }
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
      batch.forEach((auditRecord) => {
        addOrUpdateForBatch(auditRecord, updates);
      });
      await cache.update(updates);
      logger.info(`Updated cache with ${updates.length} updates`);

      dateOfLastAuditRecord = batch[batch.length - 1].timestamp;
      cache.setDateOfLastAuditRecord(dateOfLastAuditRecord);
      logger.info(`Updated cache with last audit date of ${dateOfLastAuditRecord}`);
    } else {
      hasMoreAuditRecords = false;
    }
  }
  logger.info('Finished updating audit cache');
};

module.exports = syncAuditCache;
