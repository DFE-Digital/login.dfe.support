const Sequelize = require("sequelize");
const config = require("./../config");

const getIntValueOrDefault = (value, defaultValue = 0) => {
  if (!value) {
    return defaultValue;
  }
  const int = parseInt(value);
  return isNaN(int) ? defaultValue : int;
};

const dbOpts = {
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/,
    ],
    name: "query",
    backoffBase: 100,
    backoffExponent: 1.1,
    timeout: 60000,
    max: 5,
  },
  host: config.audit.params.host,
  dialect: config.audit.params.dialect,
  dialectOptions: {
    encrypt: config.audit.params.encrypt || true,
  },
  logging: false,
};
if (config.audit.params.pool) {
  dbOpts.pool = {
    max: getIntValueOrDefault(config.audit.params.pool.max, 5),
    min: getIntValueOrDefault(config.audit.params.pool.min, 0),
    acquire: getIntValueOrDefault(config.audit.params.pool.acquire, 10000),
    idle: getIntValueOrDefault(config.audit.params.pool.idle, 10000),
  };
}
const db = new Sequelize(
  config.audit.params.name,
  config.audit.params.username,
  config.audit.params.password,
  dbOpts,
);

// Mapping organisationid to organisationId as the all lowercase column
// is an oddity and this conversion should reduce mistakes when using
// that field on this object.
const logs = db.define(
  "AuditLogs",
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    level: Sequelize.STRING,
    message: Sequelize.STRING,
    application: Sequelize.STRING,
    environment: Sequelize.STRING,
    type: Sequelize.STRING,
    subType: Sequelize.STRING,
    userId: Sequelize.UUID,
    organisationId: {
      type: Sequelize.UUID,
      field: "organisationid",
    },
  },
  {
    timestamps: true,
    tableName: "AuditLogs",
    schema: "dbo",
  },
);

const meta = db.define(
  "AuditLogMeta",
  {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    key: Sequelize.STRING,
    value: Sequelize.STRING,
  },
  {
    timestamps: false,
    tableName: "AuditLogMeta",
    schema: "dbo",
  },
);
meta.belongsTo(logs, { as: "auditLog", foreignKey: "auditId" });

logs.hasMany(meta, { as: "metaData", foreignKey: "auditId" });

module.exports = {
  db,
  logs,
  meta,
};
