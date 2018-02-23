const Sequelize = require('sequelize');
const config = require('./../config');

const db = new Sequelize(config.audit.params.name, config.audit.params.username, config.audit.params.password, {
  host: config.audit.params.host,
  dialect: config.audit.params.dialect,
  dialectOptions: {
    encrypt: config.audit.params.encrypt || false,
  },
});

const logs = db.define('AuditLogs', {
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
}, {
  timestamps: true,
  tableName: 'AuditLogs',
  schema: 'dbo',
});

const meta = db.define('AuditLogMeta', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  key: Sequelize.STRING,
  value: Sequelize.STRING,
}, {
  timestamps: false,
  tableName: 'AuditLogMeta',
  schema: 'dbo',
});
meta.belongsTo(logs, { as: 'auditLog', foreignKey: 'auditId' });


logs.hasMany(meta, { as: 'metaData', foreignKey: 'auditId' });

module.exports = {
  db,
  logs,
  meta,
};
