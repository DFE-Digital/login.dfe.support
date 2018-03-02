const { logs, db } = require('./sequelize-schema');
const Sequelize = require('sequelize');
const { getUser } = require('./../../infrastructure/directories');

const Op = Sequelize.Op;
const pageSize = 25;

const mapAuditEntity = (auditEntity) => {
  const audit = {
    type: auditEntity.getDataValue('type'),
    subType: auditEntity.getDataValue('subType'),
    userId: auditEntity.getDataValue('userId').toLowerCase(),
    level: auditEntity.getDataValue('level'),
    message: auditEntity.getDataValue('message'),
    timestamp: auditEntity.getDataValue('createdAt'),
  };

  auditEntity.metaData.forEach((meta) => {
    const key = meta.getDataValue('key');
    const value = meta.getDataValue('value');
    audit[key] = value;
  });

  return audit;
};

const getPageOfAudits = async (where, pageNumber) => {
  const auditLogs = await logs.findAll({
    where,
    order: [['createdAt', 'DESC']],
    offset: (pageNumber - 1) * pageSize,
    limit: pageSize,
    include: ['metaData'],
  });
  const count = (await logs.findAll({
    attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'CountOfAudits']],
    where,
  }))[0].get('CountOfAudits');

  return {
    audits: auditLogs.map(mapAuditEntity),
    numberOfPages: Math.ceil(count / pageSize),
    numberOfRecords: count,
  }
};

const getUserName = async (userId) => {
  const user = await getUser(userId);

  return `${user.given_name} ${user.family_name}`;
};


const getUserAudit = async (userId, pageNumber) => {
  return getPageOfAudits({
    userId: {
      [Op.eq]: userId,
    }
  }, pageNumber);
};

const getUserLoginAuditsSince = async (userId, sinceDate) => {
  const auditLogs = await logs.findAll({
    where: {
      userId: {
        [Op.eq]: userId,
      },
      type: {
        [Op.eq]: 'sign-in',
      },
      createdAt: {
        [Op.gte]: sinceDate,
      },
    },
    order: [['createdAt', 'DESC']],
    include: ['metaData'],
  });

  return auditLogs.map(mapAuditEntity);
};

const getUserLoginAuditsForService = async (userId, clientId, pageNumber) => {
  const metaSubQuery = db.dialect.QueryGenerator.selectQuery('AuditLogMeta', {
    attributes: ['AuditId'],
    where: {
      key: {
        [Op.eq]: 'ClientId',
      },
      value: {
        [Op.eq]: clientId,
      },
    },
  }).slice(0, -1);

  return getPageOfAudits({
    userId: {
      [Op.eq]: userId,
    },
    id: {
      $in: [Sequelize.literal(metaSubQuery)],
    },
  }, pageNumber);
};

const getUserChangeHistory = async (userId, pageNumber) => {
  const metaSubQuery = db.dialect.QueryGenerator.selectQuery('AuditLogMeta', {
    attributes: ['AuditId'],
    where: {
      key: {
        [Op.eq]: 'editedUser',
      },
      value: {
        [Op.eq]: userId,
      },
    },
  }).slice(0, -1);

  return getPageOfAudits({
    type: {
      [Op.eq]: 'support',
    },
    subType: {
      [Op.eq]: 'user-edit',
    },
    id: {
      $in: [Sequelize.literal(metaSubQuery)],
    },
  }, pageNumber);
};

const getTokenAudits = async (userId, serialNumber, pageNumber, userName) => {
  const metaSubQuery = db.dialect.QueryGenerator.selectQuery('AuditLogMeta', {
    attributes: ['AuditId'],
    where: {
      key: {
        [Op.eq]: 'deviceSerialNumber',
      },
      value: {
        [Op.eq]: serialNumber,
      },
    },
  }).slice(0, -1);
  const rawAudits = await getPageOfAudits({
    userId: {
      [Op.eq]: userId,
    },
    id: {
      $in: [Sequelize.literal(metaSubQuery)],
    },
  }, pageNumber);

  if(!rawAudits || !rawAudits.audits || rawAudits.audits.length === 0){
    return null;
  }

  return Promise.all(rawAudits.map(async (audit) => {
    audit.date = new Date(audit.timestamp);
    audit.name = audit.userId === userId ? userName : await getUserName(audit.userId);
    audit.success = audit.success ? 'Success' : 'Failure';

    if (audit.type === 'sign-in' && audit.subType === 'digipass') {
      audit.event = 'Login';
    } else if (audit.type === 'support' && audit.subType === 'digipass-resync') {
      audit.event = 'Resync';
    } else if (audit.type === 'support' && audit.subType === 'digipass-unlock') {
      audit.event = `Unlock - UnlockType: "${audit.unlockType}"`;
    } else if (audit.type === 'support' && audit.subType === 'digipass-deactivate') {
      audit.event = `Deactivate`;
    } else {
      audit.event = $`Digipass event ${audit.type} - ${audit.subType}`;
    }
    return audit;
  }));
};

module.exports = {
  getUserAudit,
  getUserLoginAuditsSince,
  getUserLoginAuditsForService,
  getUserChangeHistory,
  getTokenAudits,
};
