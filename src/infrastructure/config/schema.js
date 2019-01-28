const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');


const identifyingPartySchema = new SimpleSchema({
  url: patterns.url,
  clientId: String,
  clientSecret: String,
  clockTolerance: SimpleSchema.Integer,
});

const cacheSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['static', 'azuresearch']
  },
  params: {
    type: Object,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'azuresearch' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    }
  },
  'params.serviceName': String,
  'params.apiKey': String,
  'params.indexPointerConnectionString': patterns.redis,
});

const claimsSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['redis'],
  },
  params: {
    type: Object,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    }
  },
  'params.connectionString': {
    type: String,
    regEx: patterns.redis,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
});

const auditSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['static', 'sequelize']
  },
  params: {
    type: schemas.sequelizeConnection,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'sequelize' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  cacheConnectionString: patterns.redis,
});

const serviceMappingSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['redis'],
  },
  params: {
    type: Object,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    }
  },
  'params.connectionString': {
    type: String,
    regEx: patterns.redis,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  key2SuccessServiceId: patterns.uuid,
});

const schedulesSchema = new SimpleSchema({
  auditCache: String,
  usersFull: String,
  usersDiff: String,
  userDevices: String,
  accessRequests: String,
  indexTidy: String,
});

const togglesSchema = new SimpleSchema({
  useGenericAddUser: Boolean,
});

const notificationsSchema = new SimpleSchema({
  connectionString: patterns.redis
});


const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  identifyingParty: identifyingPartySchema,
  cache: cacheSchema,
  claims: claimsSchema,
  directories: schemas.apiClient,
  organisations: schemas.apiClient,
  applications: schemas.apiClient,
  access: schemas.apiClient,
  search: schemas.apiClient,
  audit: auditSchema,
  serviceMapping: serviceMappingSchema,
  devices: schemas.apiClient,
  hotConfig: schemas.apiClient,
  schedules: schedulesSchema,
  toggles: togglesSchema,
  notifications: notificationsSchema
});

module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger)
};
