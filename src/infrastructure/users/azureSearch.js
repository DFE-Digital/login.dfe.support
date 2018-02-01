const redis = require('redis');
const { promisify } = require('util');
const rp = require('request-promise');
const config = require('./../config');
const uuid = require('uuid/v4');
const logger = require('./../logger');

const client = redis.createClient({
  url: config.cache.params.indexPointerConnectionString,
});
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const pageSize = 25;

const getAzureSearchUri = (indexName, indexResource = '') => {
  let indexUriSegments = '';
  if (indexName) {
    indexUriSegments = `/${indexName}${indexResource}`;
  }
  return `https://${config.cache.params.serviceName}.search.windows.net/indexes${indexUriSegments}?api-version=2016-09-01`
};


const search = async (criteria, pageNumber, sortBy = 'name', sortAsc = true) => {
  const currentIndexName = await getAsync('CurrentIndex_Users');

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
      default:
        orderBy = sortAsc ? 'name' : 'name desc';
        break;
    }

    const response = await rp({
      method: 'GET',
      uri: `${getAzureSearchUri(currentIndexName, '/docs')}&search=${criteria}&$count=true&$skip=${skip}&$top=${pageSize}&$orderby=${orderBy}`,
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
      users: response.value.map((user) => {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          organisation: user.organisationName ? {
            name: user.organisationName
          } : null,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          status: {
            description: user.statusDescription
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
          { name: 'id', type: 'Edm.String', key: true, searchable: false },
          { name: 'name', type: 'Edm.String', sortable: true, filterable: true },
          { name: 'email', type: 'Edm.String', sortable: true, filterable: true },
          { name: 'organisationName', type: 'Edm.String', sortable: true, filterable: true },
          { name: 'lastLogin', type: 'Edm.Int64', sortable: true, filterable: true },
          { name: 'statusDescription', type: 'Edm.String', sortable: true, filterable: true },
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
          return {
            '@search.action': 'upload',
            id: user.id,
            name: user.name,
            email: user.email,
            organisationName: user.organisation ? user.organisation.name : '',
            lastLogin: user.lastLogin,
            statusDescription: user.status.description,
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
  await setAsync('CurrentIndex_Users', index)
};

const deleteUnusedIndexes = async () => {
  const currentIndexName = await getAsync('CurrentIndex_Users');

  // Delete any indexes already marked as unused
  const unusedJson = await getAsync('UnusedIndexes_Users');
  const unusedIndexes = unusedJson ? JSON.parse(unusedJson) : [];
  for (let i = 0; i < unusedIndexes.length; i++) {
    if (unusedIndexes[i] !== currentIndexName) {
      await rp({
        method: 'DELETE',
        uri: getAzureSearchUri(unusedIndexes[i]),
        headers: {
          'api-key': config.cache.params.apiKey,
        },
        json: true,
      });
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
  await setAsync('UnusedIndexes_Users', JSON.stringify(indexesAppearingUnused));
};

module.exports = {
  search,
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
};
