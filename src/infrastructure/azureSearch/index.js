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

module.exports = {
  createIndex,
  updateIndex,
};

