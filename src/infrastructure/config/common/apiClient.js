const SimpleSchema = require('simpl-schema').default;
const patterns = require('./patterns');

module.exports = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['static', 'api'],
  },
  service: {
    type: Object,
    optional: true,
    custom: function() {
      if (this.siblingField('type').value === 'api' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'service.url': patterns.url,
  'service.auth': Object,
  'service.auth.type': {
    type: String,
    allowedValues: ['aad', 'secret'],
  },
  'service.auth.jwt': {
    type: String,
    optional: true,
    custom: function() {
      if (this.siblingField('type').value === 'secret' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'service.auth.tenant': {
    type: String,
    optional: true,
    custom: function() {
      if (this.siblingField('type').value !== 'secret' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'service.auth.authorityHostUrl': {
    type: String,
    regEx: /^http(s{0,1}):\/\/.*$/,
    optional: true,
    custom: function() {
      if (this.siblingField('type').value !== 'secret' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'service.auth.clientId': {
    type: String,
    optional: true,
    custom: function() {
      if (this.siblingField('type').value !== 'secret' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'service.auth.clientSecret': {
    type: String,
    optional: true,
    custom: function() {
      if (this.siblingField('type').value !== 'secret' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'service.auth.resource': {
    type: String,
    optional: true,
    custom: function() {
      if (this.siblingField('type').value !== 'secret' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
});