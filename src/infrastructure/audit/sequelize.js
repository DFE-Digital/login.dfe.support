const Sequelize = require('sequelize');
const { logs, db } = require('./sequelize-schema');
const { getUser } = require('./../../infrastructure/directories');

const { Op } = Sequelize;
const { QueryTypes } = Sequelize;
const pageSize = 25;

const mapAuditEntity = (auditEntity) => {
  const audit = {
    type: auditEntity.getDataValue('type'),
    subType: auditEntity.getDataValue('subType'),
    userId: auditEntity.getDataValue('userId') ? auditEntity.getDataValue('userId').toLowerCase() : '',
    level: auditEntity.getDataValue('level'),
    message: auditEntity.getDataValue('message'),
    timestamp: auditEntity.getDataValue('createdAt'),
    organisationId: auditEntity.getDataValue('organisationId'),
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
  };
};

const getPageOfUserAudits = async (userId, pageNumber) => {
  const queryWhere = `
    WHERE type != 'technical-audit'
    AND id IN (
      SELECT AL.id FROM AuditLogs AL LEFT JOIN AuditLogMeta ALM on AL.id = ALM.auditId
        WHERE AL.userId = :userId OR (ALM.[key] IN ('editedUser', 'viewedUser') AND ALM.[value] = :userId)
    )`;
  const queryOpts = {
    type: QueryTypes.SELECT,
    replacements: { userId },
  };
  const skip = (pageNumber - 1) * pageSize;
  const { count } = (await db.query(`SELECT COUNT(1) count FROM AuditLogs ALPage ${queryWhere};`, queryOpts))[0];
  const rows = await db.query(
    `SELECT AuditLogs.*, AuditLogMeta.[key], AuditLogMeta.[value]
      FROM (
        SELECT * FROM AuditLogs ALPage
        ${queryWhere}
        ORDER BY ALPage.[createdAt] DESC
        OFFSET ${skip} ROWS FETCH NEXT 25 ROWS ONLY
      ) AuditLogs
    LEFT JOIN AuditLogMeta ON AuditLogs.id = AuditLogMeta.auditId
    ORDER BY AuditLogs.[createdAt] DESC`,
    queryOpts,
  );

  const entities = [];
  let currentEntity;
  for (let i = 0; i < rows.length; i += 1) {
    const currentRow = rows[i];
    if (!currentEntity || currentRow.id !== currentEntity.id) {
      currentEntity = {
        id: currentRow.id,
        type: currentRow.type,
        subType: currentRow.subType,
        userId: currentRow.userId ? currentRow.userId.toLowerCase() : '',
        level: currentRow.level,
        message: currentRow.message,
        timestamp: currentRow.createdAt,
        organisationId: currentRow.organisationId,
      };
      entities.push(currentEntity);
    }

    if (currentRow.key) {
      const isJson = currentRow.key === 'editedFields';
      currentEntity[currentRow.key] = isJson ? JSON.parse(currentRow.value) : currentRow.value;
    }
  }
  return {
    audits: entities,
    numberOfPages: Math.ceil(count / pageSize),
    numberOfRecords: count,
  };
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
  const metaSubQuery = db.dialect.QueryGenerator.selectQuery('AuditLogMeta', {
    attributes: ['AuditId'],
    where: {
      [Op.or]: [
        {
          key: {
            [Op.eq]: 'editedUser',
          },
        },
        {
          key: {
            [Op.eq]: 'viewedUser',
          },
        },
      ],
      value: {
        [Op.eq]: userId,
      },
    },
  }).slice(0, -1);

  return getPageOfAudits({
    [Op.or]:
      {
        userId: {
          [Op.eq]: userId,
        },
        id: {
          [Op.in]: [Sequelize.literal(metaSubQuery)],
        },
      },
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
    event = 'Deactivate';
  } else if (type === 'support' && subType === 'digipass-assign') {
    event = 'Assigned';
  }
  return event;
};

const getTokenAudits = async (userId, serialNumber, pageNumber, userName) => {
  const where = {
    key: {
      [Op.eq]: 'deviceSerialNumber',
    },
    value: {
      [Op.eq]: serialNumber,
    },
  };
  const metaSubQuery = db.dialect.QueryGenerator.selectQuery('AuditLogMeta', {
    attributes: ['AuditId'],
    where,
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

  const auditRecords = [];

  for (let i = 0; i < rawAudits.audits.length; i++) {
    const audit = rawAudits.audits[i];

    auditRecords.push({
      date: new Date(audit.timestamp),
      name: audit.userId ? (audit.userId === userId ? userName : await getUserName(audit.userId)) : audit.userEmail,
      success: audit.success === '0' ? 'Failure' : 'Success',
      event: getAuditEvent(audit.type, audit.subType, audit.unlockType),
    });
  }

  return {
    audits: auditRecords,
    numberOfPages: rawAudits.numberOfPages,
    numberOfRecords: rawAudits.numberOfRecords,
  };
};

module.exports = {
  getAllAuditsSince,
  getUserAudit,
  getUserLoginAuditsSince,
  getUserLoginAuditsForService,
  getUserChangeHistory,
  getTokenAudits,
  getPageOfUserAudits,
};
