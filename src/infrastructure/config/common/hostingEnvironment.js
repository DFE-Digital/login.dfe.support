const SimpleSchema = require('simpl-schema').default;
const agentKeepAlive = require('./agentKeepAlive');

module.exports = new SimpleSchema({
  useDevViews: {
    type: Boolean,
    optional: true,
  },
  env: String,
  host: String,
  port: {
    type: SimpleSchema.Integer,
  },
  protocol: {
    type: String,
    allowedValues: ['http', 'https'],
  },
  sslCert: {
    type: String,
    optional: true,
  },
  sslKey: {
    type: String,
    optional: true,
  },
  sessionSecret: {
    type: String,
    optional: true,
  },
  applicationInsights : {
    type: String,
    optional: true,
  },
  sessionCookieExpiryInMinutes: {
    type: SimpleSchema.Integer,
    optional: true,
  },
  gaTrackingId: {
    type: String,
    optional: true,
  },
  interactionsUrl: {
    type: String,
    optional: true,
  },
  profileUrl: {
    type: String,
    optional: true,
  },
  helpUrl: {
    type: String,
    optional: true,
  },
  servicesUrl: {
    type: String,
    optional: true,
  },
  supportUrl: {
    type: String,
    optional: true,
  },
  redisPingInSeconds: {
    type: SimpleSchema.Integer,
    optional:true,
  },
  agentKeepAlive: agentKeepAlive,
});