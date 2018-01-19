const redis = require('redis');
const { promisify } = require('util');
const rp = require('request-promise');
const config = require('./../config');
const uuid = require('uuid/v4');

const client = redis.createClient({
  url: config.cache.params.indexPointerConnectionString,
});
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const pageSize = 25;

const getAzureSearchUri = (indexName, indexResource = '') => {
  return `https://${config.cache.params.serviceName}.search.windows.net/indexes/${indexName}${indexResource}?api-version=2016-09-01`
};


const search = async (criteria, pageNumber) => {
  const currentIndexName = await getAsync('CurrentIndex_Users');

  try {
    const skip = (pageNumber - 1) * pageSize;
    const response = await rp({
      method: 'GET',
      uri: `${getAzureSearchUri(currentIndexName, '/docs')}&search=${criteria}&$count=true&$skip=${skip}&$top=${pageSize}&$orderby=name`,
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

module.exports = {
  search,
  createIndex,
  updateIndex,
  updateActiveIndex,
};
