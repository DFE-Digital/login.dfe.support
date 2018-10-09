const SimpleSchema = require('simpl-schema').default;

module.exports = new SimpleSchema({
  connectionString: {
    type: String,
    optional: true
  },
  host: {
    type: String,
    optional: true
  },
  username: {
    type: String,
    optional: true
  },
  password: {
    type: String,
    optional: true
  },
  dialect: {
    type: String,
    optional: true,
    allowedValues: ['postgres', 'mssql'],
  },
  name: {
    type: String,
    optional: true
  },
  encrypt: {
    type: Boolean,
    optional: true
  },
  schema: {
    type: String,
    optional: true
  },

  pool: {
    type: Object,
    optional: true,
  },
  'pool.max': {
    type: SimpleSchema.Integer,
    optional: true,
  },
  'pool.min': {
    type: SimpleSchema.Integer,
    optional: true,
  },
  'pool.acquire': {
    type: SimpleSchema.Integer,
    optional: true,
  },
  'pool.idle': {
    type: SimpleSchema.Integer,
    optional: true,
  },
});