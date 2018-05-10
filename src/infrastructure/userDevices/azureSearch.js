'use strict';

const Redis = require('ioredis');
const config = require('./../config');
const uuid = require('uuid/v4');
const azureSearch = require('./../azureSearch');

const client = new Redis(config.cache.params.indexPointerConnectionString);

const pageSize = 25;

const createIndex = async () => {
  const fields = [
    { name: 'id', type: 'Edm.String', key: true, searchable: false },
    { name: 'deviceId', type: 'Edm.String', searchable: false },
    { name: 'deviceStatus', type: 'Edm.String', searchable: false, filterable: true },
    { name: 'serialNumber', type: 'Edm.String', sortable: true, searchable: true },
    { name: 'name', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'nameSearch', type: 'Edm.String', searchable: true },
    { name: 'email', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'emailSearch', type: 'Edm.String', searchable: true },
    { name: 'organisationName', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'lastLogin', type: 'Edm.Int64', sortable: true, filterable: true },
  ];
  return await azureSearch.createIndex(`userdevices-${uuid()}`, fields);

};

const updateIndex = async (userDevices, index) => {

  if(!userDevices || userDevices.length === 0) {
    return;
  }

  if(!index) {
    index = await client.get('CurrentIndex_UserDevices');
  }

  const userDeviceMap = userDevices.map((userDevice) => {
      let lastLogin = userDevice.lastLogin;
      if (lastLogin && lastLogin instanceof Date) {
        lastLogin = lastLogin.getTime();
      }
      return {
        '@search.action': 'upload',
        id: userDevice.id,
        deviceId: userDevice.device.id,
        deviceStatus: userDevice.device.status,
        serialNumber: userDevice.device.serialNumber,
        name: userDevice.name,
        nameSearch: userDevice.name.replace(' ','').toLowerCase(),
        email: userDevice.email,
        emailSearch: encodeURIComponent(userDevice.email).toLowerCase(),
        organisationName: userDevice.organisation ? userDevice.organisation.name : '',
        lastLogin,
      };
    });

  return await azureSearch.updateIndex(userDeviceMap, index)
};

const updateActiveIndex = async (index) => {
  await client.set('CurrentIndex_UserDevices', index)
};

const deleteUnusedIndexes = async () => {
  const currentIndexName = await client.get('CurrentIndex_UserDevices');

  // Delete any indexes already marked as unused
  const unusedJson = await client.get('UnusedIndexes_UserDevices');
  const unusedIndexes = unusedJson ? JSON.parse(unusedJson) : [];
  await azureSearch.deleteUnusedIndexes(unusedIndexes, currentIndexName);

  // Find any remaining indexes that appear to be unused
  const indexesResponse = await azureSearch.getIndexes();
  const indexesAppearingUnused = indexesResponse.value.map(x => x.name).filter(x => x !== currentIndexName && x.toLowerCase().indexOf('userdevices-') !== -1);
  await client.set('UnusedIndexes_UserDevices', JSON.stringify(indexesAppearingUnused));
};

const mapUser = (user) => {

  if(!user) {
    return null;
  }

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
      serialNumberFormatted: `${user.serialNumber.substr(0, 2)}-${user.serialNumber.substr(2, 7)}-${user.serialNumber.substr(9, 1)}`
    }
  }
};

const search = async (criteria, pageNumber, sortBy = 'serialNumber', sortAsc = true) => {
  const currentIndexName = await client.get('CurrentIndex_UserDevices');

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
      case 'name':
        orderBy = sortAsc ? 'name' : 'name desc';
        break;
      case 'status':
        orderBy = sortAsc ? 'deviceStatus' : 'deviceStatus desc';
        break;
      case 'lastlogin':
        orderBy = sortAsc ? 'lastLogin desc' : 'lastLogin';
        break;
      default:
        orderBy = sortAsc ? 'serialNumber' : 'serialNumber desc';
        break;
    }
    criteria = criteria.replace(' ','').toLowerCase();
    const formattedCriteria = criteria.replace(/-/g,'');
    const serialNumber = parseInt(formattedCriteria);
    if(!isNaN(serialNumber)) {
      criteria = formattedCriteria;
    }

    const response = await azureSearch.search(currentIndexName, criteria, skip, pageSize, orderBy);

    let numberOfPages = 1;
    const totalNumberOfResults = parseInt(response['@odata.count']);
    if (!isNaN(totalNumberOfResults)) {
      numberOfPages = Math.ceil(totalNumberOfResults / pageSize);
    }

    return {
      userDevices: response.value.map((user) => {
        return mapUser(user);
      }),
      numberOfPages,
      totalNumberOfResults,
    };
  } catch (e) {
    throw e;
  }
};

const getByUserId = async (userId, filterParam='id') => {
  try {
    const currentIndexName = await client.get('CurrentIndex_UserDevices');
    const user = await azureSearch.getIndexById(currentIndexName, userId, filterParam);
    return mapUser(user);
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
  getByUserId,
};

