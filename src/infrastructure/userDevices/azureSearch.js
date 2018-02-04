'use strict';

const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const uuid = require('uuid/v4');
const azureSearch = require('./../azureSearch');

const client = redis.createClient({
  url: config.cache.params.indexPointerConnectionString,
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const pageSize = 25;

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


const search = async (criteria, pageNumber, sortBy = 'name', sortAsc = true) => {
  const currentIndexName = await getAsync('CurrentIndex_UserDevices');

  try {
    const skip = (pageNumber - 1) * pageSize;
    let orderBy;
    switch (sortBy) {
      case 'serialNumber':
        orderBy = sortAsc ? 'serialNumber' : 'serialNumber desc';
        break;
      case 'organisation':
        orderBy = sortAsc ? 'organisationName' : 'organisationName desc';
        break;
      case 'lastlogin':
        orderBy = sortAsc ? 'lastLogin desc' : 'lastLogin';
        break;
      default:
        orderBy = sortAsc ? 'serialNumber' : 'serialNumber desc';
        break;
    }

    const response = await azureSearch.search(currentIndexName, criteria, skip, pageSize, orderBy);

    let numberOfPages = 1;
    const totalNumberOfResults = parseInt(response['@odata.count']);
    if (!isNaN(totalNumberOfResults)) {
      numberOfPages = Math.ceil(totalNumberOfResults / pageSize);
    }

    return {
      users: response.value.map((user) => {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          organisation: user.organisationName ? {
            name: user.organisationName
          } : null,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          device: {
            id: user.deviceId,
            status: user.deviceStatus,
            serialNumber: user.serialNumber,
          }
        }
      }),
      numberOfPages,
      totalNumberOfResults,
    };
  } catch (e) {
    throw e;
  }
};

module.exports = {
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
  search,
};

