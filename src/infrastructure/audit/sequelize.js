const Sequelize = require("sequelize");
const { logs, db } = require("./sequelize-schema");

const { Op } = Sequelize;
const { QueryTypes } = Sequelize;
const pageSize = 25;

const mapAuditEntity = (auditEntity) => {
  const audit = {
    type: auditEntity.getDataValue("type"),
    subType: auditEntity.getDataValue("subType"),
    userId: auditEntity.getDataValue("userId")
      ? auditEntity.getDataValue("userId").toLowerCase()
      : "",
    level: auditEntity.getDataValue("level"),
    message: auditEntity.getDataValue("message"),
    timestamp: auditEntity.getDataValue("createdAt"),
    organisationId: auditEntity.getDataValue("organisationId"),
  };

  auditEntity.metaData.forEach((meta) => {
    const key = meta.getDataValue("key");
    const value = meta.getDataValue("value");
    const isJson = key === "editedFields";
    audit[key] = isJson ? JSON.parse(value) : value;
  });

  return audit;
};

const getPageOfUserAudits = async (userId, pageNumber) => {
  const queryWhere = `
    WHERE type != 'technical-audit'
    AND id IN (
      SELECT AL.id
        FROM AuditLogs AL
        WHERE AL.userId = :userId
      UNION
      SELECT AL.id
        FROM AuditLogs AL
        JOIN AuditLogMeta ALM
          ON ALM.auditId = AL.id
        WHERE ALM.[key] IN ('editedUser', 'viewedUser')
          AND ALM.[Value] = :userId
    )`;
  const queryOpts = {
    type: QueryTypes.SELECT,
    replacements: { userId },
  };
  const skip = (pageNumber - 1) * pageSize;
  const { count } = (
    await db.query(
      `SELECT COUNT(1) count FROM AuditLogs ALPage ${queryWhere};`,
      queryOpts,
    )
  )[0];
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
        userId: currentRow.userId ? currentRow.userId.toLowerCase() : "",
        level: currentRow.level,
        message: currentRow.message,
        timestamp: currentRow.createdAt,
        organisationId: currentRow.organisationid,
      };
      entities.push(currentEntity);
    }

    if (currentRow.key) {
      if (currentRow.key === "userId" && currentRow.value) {
        currentRow.value = currentRow.value.replace(/['"]+/g, "");
      }
      const isJson = currentRow.key === "editedFields";
      currentEntity[currentRow.key] = isJson
        ? JSON.parse(currentRow.value)
        : currentRow.value;
    }
  }
  return {
    audits: entities,
    numberOfPages: Math.ceil(count / pageSize),
    numberOfRecords: count,
  };
};

const getAllAuditsSince = async (sinceDate) => {
  const auditLogs = await logs.findAll({
    where: {
      createdAt: {
        [Op.gt]: sinceDate,
      },
    },
    limit: 1000,
    order: [["createdAt", "ASC"]],
    include: ["metaData"],
  });

  return auditLogs.map(mapAuditEntity);
};

module.exports = {
  getAllAuditsSince,
  getPageOfUserAudits,
};
