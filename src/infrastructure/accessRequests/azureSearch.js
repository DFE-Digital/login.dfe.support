'use strict';

const Redis = require('ioredis');
const config = require('./../config');
const uuid = require('uuid/v4');
const azureSearch = require('./../azureSearch');

const client = new Redis(config.cache.params.indexPointerConnectionString);

const establishment = '001';
const multiAcademyTrust = '010';
const singleAcademyTrust = '013';
const pageSize = 25;

const createIndex = async () => {
  const fields = [
    { name: 'userOrgId', type: 'Edm.String', key: true, searchable: false },
    { name: 'userId', type: 'Edm.String', searchable: false },
    { name: 'orgId', type: 'Edm.String', searchable: false },
    { name: 'name', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'nameSearch', type: 'Edm.String',  searchable: true },
    { name: 'email', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'emailSearch', type: 'Edm.String',  searchable: true },
    { name: 'createdDate',  type: 'Edm.Int64', sortable: true, filterable: true },
    { name: 'organisationName', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
    { name: 'organisationAddress', type: 'Edm.String'},
    { name: 'organisationIdentifier', type: 'Edm.String'},
  ];
  return await azureSearch.createIndex(`accessrequests-${uuid()}`, fields);

};

const updateIndex = async (accessRequests, index) => {

  if(!accessRequests || accessRequests.length === 0) {
    return;
  }

  if(!index) {
    index = await client.get('CurrentIndex_AccessRequests');
  }

  const accessRequestMap = accessRequests.map((accessRequest) => {

      let orgIdentifier = '';

      if (accessRequest.organisation.category === establishment) {
        orgIdentifier = `URN: ${accessRequest.organisation.urn}`;
      } else if (accessRequest.organisation.category === multiAcademyTrust || accessRequest.organisation.category === singleAcademyTrust) {
        orgIdentifier = `UID: ${accessRequest.organisation.uid}`;
      }

      return {
        '@search.action': 'upload',
        userOrgId: `${accessRequest.userId}${accessRequest.organisation.id}`,
        userId: accessRequest.userId,
        name: accessRequest.name,
        nameSearch: accessRequest.name ? accessRequest.name.replace(/\s/g, '').toLowerCase() : '',
        email: accessRequest.email,
        emailSearch: accessRequest.email ? accessRequest.email.replace('@','').toLowerCase() : '',
        organisationName: accessRequest.organisation.name,
        orgId: accessRequest.organisation.id,
        orgIdentifier: orgIdentifier,
        orgAddress: accessRequest.organisation.address,
        createdDate: new Date(accessRequest.createdDate).getTime(),
      };
    });

  return await azureSearch.updateIndex(accessRequestMap, index)
};

const updateActiveIndex = async (index) => {
  await client.set('CurrentIndex_AccessRequests', index)
};

const deleteUnusedIndexes = async () => {
  const currentIndexName = await client.get('CurrentIndex_AccessRequests');

  // Delete any indexes already marked as unused
  const unusedJson = await client.get('UnusedIndexes_AccessRequests');
  const unusedIndexes = unusedJson ? JSON.parse(unusedJson) : [];
  await azureSearch.deleteUnusedIndexes(unusedIndexes, currentIndexName);

  // Find any remaining indexes that appear to be unused
  const indexesResponse = await azureSearch.getIndexes();
  const indexesAppearingUnused = indexesResponse.value.map(x => x.name).filter(x => x !== currentIndexName && x.toLowerCase().indexOf('accessrequests-') !== -1);
  await client.set('UnusedIndexes_AccessRequests', JSON.stringify(indexesAppearingUnused));
};

const mapAccessRequest = (accessRequest) => {

  if(!accessRequest) {
    return null;
  }

  return {
    userId: accessRequest.userId,
    name: accessRequest.name,
    email: accessRequest.email,
    organisation: accessRequest.organisationName ? {
      id: accessRequest.orgId,
      name: accessRequest.organisationName,
      address: accessRequest.orgAddress,
      identifier: accessRequest.orgIdentifier,
    } : null,
    createdDate: new Date(accessRequest.createdDate),
    userOrgId: accessRequest.userOrgId,
  }
};

const search = async (criteria, pageNumber, sortBy = 'name', sortAsc = true) => {
  const currentIndexName = await client.get('CurrentIndex_AccessRequests');

  try {
    const skip = (pageNumber - 1) * pageSize;
    let orderBy;
    switch (sortBy) {
      case 'organisation':
        orderBy = sortAsc ? 'organisationName' : 'organisationName desc';
        break;
      case 'email':
        orderBy = sortAsc ? 'email' : 'email desc';
        break;
      case 'name':
        orderBy = sortAsc ? 'name' : 'name desc';
        break;
      case 'createdDate':
        orderBy = sortAsc ? 'createdDate desc' : 'createdDate';
        break;
      default:
        orderBy = sortAsc ? 'name' : 'name desc';
        break;
    }
    criteria = criteria.replace(/\s/g, '').replace('@','').toLowerCase();
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
      accessRequests: response.value.map((user) => {
        return mapAccessRequest(user);
      }),
      numberOfPages,
      totalNumberOfResults,
    };
  } catch (e) {
    throw e;
  }
};

const getById = async (id, filterParam='userOrgId') => {
  try {
    const currentIndexName = await client.get('CurrentIndex_AccessRequests');
    const user = await azureSearch.getIndexById(currentIndexName, id, filterParam);
    return mapAccessRequest(user);
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
  getById,
};

