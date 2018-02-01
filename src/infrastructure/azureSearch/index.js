'use strict';

const rp = require('request-promise');
const config = require('./../config');

const getAzureSearchUri = (indexName, indexResource = '') => {
  let indexUriSegments = '';
  if (indexName) {
    indexUriSegments = `/${indexName}${indexResource}`;
  }
  return `https://${config.cache.params.serviceName}.search.windows.net/indexes${indexUriSegments}?api-version=2016-09-01`
};

const createIndex = async (indexName, fields) => {
  try {
    await rp({
      method: 'PUT',
      uri: getAzureSearchUri(indexName),
      headers: {
        'content-type': 'application/json',
        'api-key': config.cache.params.apiKey,
      },
      body: {
        name: indexName,
        fields
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
        value: users
      },
      json: true,
    });
  } catch (e) {
    throw e;
  }
};

const deleteUnusedIndexes = async (unusedIndexes, currentIndexName) => {
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
    }
  }
};

const getIndexes = async () => {
  return await rp({
    method: 'GET',
    uri: getAzureSearchUri(),
    headers: {
      'api-key': config.cache.params.apiKey,
    },
    json: true,
  });
}

module.exports = {
  createIndex,
  updateIndex,
  deleteUnusedIndexes,
  getIndexes,
};

