const Redis = require('ioredis');
const config = require('./../config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;
const rp = require('request-promise').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});


const uuid = require('uuid/v4');
const logger = require('./../logger');

const client = new Redis(config.cache.params.indexPointerConnectionString);

const pageSize = 25;

const getAzureSearchUri = (indexName, indexResource = '') => {
  let indexUriSegments = '';
  if (indexName) {
    indexUriSegments = `/${indexName}${indexResource}`;
  }
  return `https://${config.cache.params.serviceName}.search.windows.net/indexes${indexUriSegments}?api-version=2016-09-01`
};

const mapSearchIndexUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organisation: user.organisationName ? {
      name: user.organisationName
    } : null,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    successfulLoginsInPast12Months: user.successfulLoginsInPast12Months,
    status: {
      id: user.statusId,
      description: user.statusDescription,
      changedOn: user.statusLastChangedOn,
    },
    pendingEmail: user.pendingEmail,
  };
};


const search = async (criteria, pageNumber, sortBy = 'name', sortAsc = true, filters = undefined) => {
  const currentIndexName = await client.get('CurrentIndex_Users');

  try {
    const skip = (pageNumber - 1) * pageSize;
    let orderBy;
    switch (sortBy) {
      case 'email':
        orderBy = sortAsc ? 'email' : 'email desc';
        break;
      case 'organisation':
        orderBy = sortAsc ? 'organisationName' : 'organisationName desc';
        break;
      case 'lastlogin':
        orderBy = sortAsc ? 'lastLogin desc' : 'lastLogin';
        break;
      case 'status':
        orderBy = sortAsc ? 'statusDescription desc' : 'statusDescription';
        break;
      default:
        orderBy = sortAsc ? 'name' : 'name desc';
        break;
    }

    let filterParam = '';
    if (filters) {
      if (filters.organisationType && filters.organisationType.length > 0) {
        if (filterParam.length > 0) {
          filterParam += ' and ';
        }
        filterParam += `organisationCategories/any(x: search.in(x, '${filters.organisationType.join(', ')}'))`
      }

      if (filters.accountStatus && filters.accountStatus.length > 0) {
        if (filterParam.length > 0) {
          filterParam += ' and ';
        }
        filterParam += `(statusId eq ${filters.accountStatus.join(' or statusId eq ')})`
      }

      if (filters.service && filters.service.length > 0) {
        if (filterParam.length > 0) {
          filterParam += ' and ';
        }
        filterParam += `services/any(x: search.in(x, '${filters.service.join(', ')}'))`
      }
    }
    
    criteria = criteria.replace(' ','').toLowerCase();
    
    let uri = `${getAzureSearchUri(currentIndexName, '/docs')}&search=${encodeURIComponent(criteria)}&$count=true&$skip=${skip}&$top=${pageSize}&$orderby=${orderBy}`;
    if (filterParam.length > 0) {
      uri += `&$filter=${filterParam}`;
    }

    const response = await rp({
      method: 'GET',
      uri,
      headers: {
        'content-type': 'application/json',
        'api-key': config.cache.params.apiKey,
      },
      json: true,
    });

    let numberOfPages = 1;
    const totalNumberOfResults = parseInt(response['@odata.count']);
    if (!isNaN(totalNumberOfResults)) {
      numberOfPages = Math.ceil(totalNumberOfResults / pageSize);
    }

    return {
      users: response.value.map(mapSearchIndexUser),
      numberOfPages,
      totalNumberOfResults,
    };
  } catch (e) {
    throw e;
  }
};

const getById = async (userId) => {
  const currentIndexName = await client.get('CurrentIndex_Users');

  try {
    const response = await rp({
      method: 'GET',
      uri: `${getAzureSearchUri(currentIndexName, '/docs')}&$filter=id+eq+'${userId}'`,
      headers: {
        'content-type': 'application/json',
        'api-key': config.cache.params.apiKey,
      },
      json: true,
    });

    if (response.value.length === 0) {
      return null;
    }

    return mapSearchIndexUser(response.value[0]);
  } catch (e) {
    throw e;
  }
};

const createIndex = async () => {
  try {
    const indexName = `users-${uuid()}`;
    await rp({
      method: 'PUT',
      uri: getAzureSearchUri(indexName),
      headers: {
        'content-type': 'application/json',
        'api-key': config.cache.params.apiKey,
      },
      body: {
        name: indexName,
        fields: [
          { name: 'id', type: 'Edm.String', key: true, searchable: false, filterable: true },
          { name: 'name', type: 'Edm.String', sortable: true, filterable: true },
          { name: 'nameSearch', type: 'Edm.String', searchable: true },
          { name: 'firstName', type: 'Edm.String' },
          { name: 'lastName', type: 'Edm.String' },
          { name: 'email', type: 'Edm.String', sortable: true, filterable: true },
          { name: 'emailSearch', type: 'Edm.String', searchable: true },
          { name: 'organisationName', type: 'Edm.String', sortable: true, filterable: true },
          { name: 'organisationCategories', type: 'Collection(Edm.String)', searchable: false, filterable: true },
          { name: 'services', type: 'Collection(Edm.String)', searchable: false, filterable: true },
          { name: 'lastLogin', type: 'Edm.Int64', sortable: true, filterable: true },
          { name: 'successfulLoginsInPast12Months', type: 'Edm.Int64' },
          { name: 'statusLastChangedOn', type: 'Edm.Int64' },
          { name: 'statusDescription', type: 'Edm.String', sortable: true, filterable: true },
          { name: 'statusId', type: 'Edm.Int64' },
          { name: 'pendingEmail', type: 'Edm.String' },
        ]
      },
      json: true,
    });
    return indexName;
  } catch (e) {
    throw e;
  }
};

const updateIndex = async (users, index) => {
  if(!users || users.length === 0) {
    return;
  }
  if (!index) {
    index = await client.get('CurrentIndex_Users');
  }
  try {
    await rp({
      method: 'POST',
      uri: getAzureSearchUri(index, '/docs/index'),
      headers: {
        'content-type': 'application/json',
        'api-key': config.cache.params.apiKey,
      },
      body: {
        value: users.map((user) => {
          let lastLogin = user.lastLogin;
          if (lastLogin && lastLogin instanceof Date) {
            lastLogin = lastLogin.getTime();
          }
          return {
            '@search.action': 'upload',
            id: user.id,
            name: user.name,
            nameSearch: user.name.replace(' ','').toLowerCase(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailSearch: encodeURIComponent(user.email).toLowerCase(),
            organisationName: user.organisation ? user.organisation.name : '',
            organisationCategories: user.organisationCategories || [],
            services: user.services || [],
            lastLogin,
            successfulLoginsInPast12Months: user.successfulLoginsInPast12Months,
            statusLastChangedOn: user.status.changedOn ? user.status.changedOn : 0,
            statusDescription: user.status.description,
            statusId: user.status.id,
            pendingEmail: user.pendingEmail,
          };
        }),
      },
      json: true,
    });
  } catch (e) {
    throw e;
  }
};

const updateActiveIndex = async (index) => {
  await client.set('CurrentIndex_Users', index)
};

const deleteUnusedIndexes = async () => {
  const currentIndexName = await client.get('CurrentIndex_Users');

  // Delete any indexes already marked as unused
  const unusedJson = await client.get('UnusedIndexes_Users');
  const unusedIndexes = unusedJson ? JSON.parse(unusedJson) : [];
  for (let i = 0; i < unusedIndexes.length; i++) {
    if (unusedIndexes[i] !== currentIndexName) {
      try {
        await rp({
          method: 'DELETE',
          uri: getAzureSearchUri(unusedIndexes[i]),
          headers: {
            'api-key': config.cache.params.apiKey,
          },
          json: true,
        });
      } catch (e) {
        if (e.statusCode !== 404) {
          throw e;
        }
      }
      logger.info(`Deleted index ${unusedIndexes[i]}`);
    }
  }

  // Find any remaining indexes that appear to be unused
  const indexesResponse = await rp({
    method: 'GET',
    uri: getAzureSearchUri(),
    headers: {
      'api-key': config.cache.params.apiKey,
    },
    json: true,
  });
  const indexesAppearingUnused = indexesResponse.value.map(x => x.name).filter(x => x !== currentIndexName && x.toLowerCase().indexOf('users-') !== -1);
  await client.set('UnusedIndexes_Users', JSON.stringify(indexesAppearingUnused));
};

module.exports = {
  search,
  getById,
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
};
