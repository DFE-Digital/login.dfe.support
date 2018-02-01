'use strict';

const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const uuid = require('uuid/v4');

const client = redis.createClient({
  url: config.cache.params.indexPointerConnectionString,
});

const getAsync = promisify(client.get).bind(client);
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

const updateIndex = async (userDevices, index) => {

  const userDeviceMap = userDevices.map((userDevice) => {
      return {
        '@search.action': 'upload',
        id: userDevice.id,
        deviceId: userDevice.device.id,
        deviceStatus: userDevice.device.status,
        serialNumber: userDevice.device.serialNumber,
        name: userDevice.name,
        email: userDevice.email,
        organisationName: userDevice.organisation ? userDevice.organisation.name : '',
        lastLogin: userDevice.lastLogin,
      };
    });

  return await azureSearch.updateIndex(userDeviceMap, index)
};

const updateActiveIndex = async (index) => {
  await setAsync('CurrentIndex_UserDevices', index)
};

const deleteUnusedIndexes = async () => {
  const currentIndexName = await getAsync('CurrentIndex_UserDevices');

  // Delete any indexes already marked as unused
  const unusedJson = await getAsync('UnusedIndexes_UserDevices');
  const unusedIndexes = unusedJson ? JSON.parse(unusedJson) : [];
  await azureSearch.deleteUnusedIndexes(unusedIndexes, currentIndexName);

  // Find any remaining indexes that appear to be unused
  const indexesResponse = await azureSearch.getIndexes();
  const indexesAppearingUnused = indexesResponse.value.map(x => x.name).filter(x => x !== currentIndexName && x.toLowerCase().indexOf('userdevices-') !== -1);
  await setAsync('UnusedIndexes_UserDevices', JSON.stringify(indexesAppearingUnused));
};

module.exports = {
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
};

