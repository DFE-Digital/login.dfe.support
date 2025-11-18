const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('../logger');

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
    type: new SimpleSchema({ ...schemas.sequelizeConnection }),
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

const adapterSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['file', 'redis', 'mongo', 'azuread', 'sequelize'],
  },
  directories: {
    type: schemas.sequelizeConnection,
    optional: true,
  },
  organisation: {
    type: schemas.sequelizeConnection,
    optional: true,
  },
});

const togglesSchema = new SimpleSchema({
  useGenericAddUser: Boolean,
});

const notificationsSchema = new SimpleSchema({
  connectionString: patterns.redis,
});

const entraSchema = new SimpleSchema({
  useEntraForAccountRegistration: {
    type: Boolean,
    optional: true,
    defaultValue: false,
  },
  cloudInstance: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  tenantId: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  clientId: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  clientSecret: {
    type: String,
    optional: true,
    defaultValue: '',
  },
  graphEndpoint: {
    type: String,
    optional: true,
    defaultValue: '',
  },
});

const accessIdentifiers = new SimpleSchema({
  identifiers: {
    type: Object,
  },
  'identifiers.service': patterns.uuid,
  'identifiers.organisation': patterns.uuid,
  'identifiers.departmentForEducation': patterns.uuid,
  'identifiers.manageService': patterns.uuid,
});

accessIdentifiers.extend(schemas.apiClient);

const encryptionSchema = new SimpleSchema({
  Aes256GcmV1Key: {
    type: String,
  },
});

const schema = new SimpleSchema({
  loggerSettings: new SimpleSchema({ ...schemas.loggerSettings }),
  hostingEnvironment: schemas.hostingEnvironment,
  identifyingParty: identifyingPartySchema,
  cache: cacheSchema,
  claims: claimsSchema,
  directories: new SimpleSchema({ ...schemas.apiClient }),
  organisations: new SimpleSchema({ ...schemas.apiClient }),
  applications: new SimpleSchema({ ...schemas.apiClient }),
  access: accessIdentifiers,
  search: new SimpleSchema({ ...schemas.apiClient }),
  audit: auditSchema,
  serviceMapping: serviceMappingSchema,
  toggles: togglesSchema,
  notifications: notificationsSchema,
  assets: new SimpleSchema({ ...schemas.assets }),
  adapter: adapterSchema,
  entra: entraSchema,
  encryption: encryptionSchema,
});

module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger);
};
