'use strict';

const redis = require('redis');
const { promisify } = require('util');
const rp = require('request-promise');
const config = require('./../config');
const uuid = require('uuid/v4');
const logger = require('./../logger');

const client = redis.createClient({
  url: config.cache.params.indexPointerConnectionString,
});

const setAsync = promisify(client.set).bind(client);

const azureSearch = require('./../azureSearch');

const createIndex = async () => {
  const fields = [
    { name: 'id', type: 'Edm.String', key: true, searchable: false },
    { name: 'deviceId', type: 'Edm.String', key: true, searchable: false },
    { name: 'deviceStatus', type: 'Edm.String', searchable: false, filterable: true },
    { name: 'serialNumber', type: 'Edm.String', key: true, searchable: true },
    { name: 'name', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'email', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'organisationName', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'lastLogin', type: 'Edm.Int64', sortable: true, filterable: true },
  ];
  return await azureSearch.createIndex(`userdevices-${uuid()}`, fields);

};

const updateActiveIndex = async (index) => {
  await setAsync('CurrentIndex_UserDevices', index)
};

module.exports = {
  createIndex,
  updateIndex,
  updateActiveIndex,
};

