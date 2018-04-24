const { logs, db } = require('./sequelize-schema');
const Sequelize = require('sequelize');
const { getUser } = require('./../../infrastructure/directories');

const Op = Sequelize.Op;
const pageSize = 25;

const mapAuditEntity = (auditEntity) => {
  const audit = {
    type: auditEntity.getDataValue('type'),
    subType: auditEntity.getDataValue('subType'),
    userId: auditEntity.getDataValue('userId') ? auditEntity.getDataValue('userId').toLowerCase() : '',
    level: auditEntity.getDataValue('level'),
    message: auditEntity.getDataValue('message'),
    timestamp: auditEntity.getDataValue('createdAt'),
  };

  auditEntity.metaData.forEach((meta) => {
    const key = meta.getDataValue('key');
    const value = meta.getDataValue('value');
    const isJson = key === 'editedFields';
    audit[key] = isJson ? JSON.parse(value) : value;
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


const getAllAuditsSince = async (sinceDate) => {
  const auditLogs = await logs.findAll({
    where: {
      createdAt: {
        [Op.gt]: sinceDate,
      },
    },
    limit: 1000,
    order: [['createdAt', 'ASC']],
    include: ['metaData'],
  });

  return auditLogs.map(mapAuditEntity);
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
      [Op.in]: [Sequelize.literal(metaSubQuery)],
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
      [Op.in]: [Sequelize.literal(metaSubQuery)],
    },
  }, pageNumber);
};

const getAuditEvent = (type, subType, unlockType) => {
  let event = `Digipass event ${type} - ${subType}`;

  if (type === 'sign-in' && subType === 'digipass') {
    event = 'Login';
  } else if (subType === 'digipass-resync') {
    event = `${type} - Resync`;
  } else if (type === 'support' && subType === 'digipass-unlock') {
    event = `Unlock - UnlockType: "${unlockType}"`;
  } else if (type === 'support' && subType === 'digipass-deactivate') {
    event = `Deactivate`;
  } else if (type === 'support' && subType === 'digipass-assign') {
    event = `Assigned`;
  }
  return event;
};

const getTokenAudits = async (userId, serialNumber, pageNumber, userName) => {

  const where =  {
    key: {
      [Op.eq]: 'deviceSerialNumber',
    },
    value: {
      [Op.eq]: serialNumber,
    },
  };
  const metaSubQuery = db.dialect.QueryGenerator.selectQuery('AuditLogMeta', {
    attributes: ['AuditId'],
    where
  }).slice(0, -1);

  const rawAudits = await getPageOfAudits({
    id: {
      [Op.in]: [Sequelize.literal(metaSubQuery)],
    },
  }, pageNumber);


  if (!rawAudits || !rawAudits.audits || rawAudits.audits.length === 0) {
    return {
      audits: [],
      numberOfPages: 0,
      numberOfRecords: 0,
    };
  }

  let auditRecords = [];

  for (let i = 0; i < rawAudits.audits.length; i++) {
    let audit = rawAudits.audits[i];

    auditRecords.push({
      date: new Date(audit.timestamp),
      name: audit.userId ? (audit.userId === userId ? userName : await getUserName(audit.userId)) : audit.userEmail,
      success: audit.success === "0" ? 'Failure' : 'Success',
      event: getAuditEvent(audit.type,audit.subType,audit.unlockType),
    });
  }

  return {
    audits: auditRecords,
    numberOfPages: rawAudits.numberOfPages,
    numberOfRecords: rawAudits.numberOfRecords
  };
};

module.exports = {
  getAllAuditsSince,
  getUserAudit,
  getUserLoginAuditsSince,
  getUserLoginAuditsForService,
  getUserChangeHistory,
  getTokenAudits,
};
