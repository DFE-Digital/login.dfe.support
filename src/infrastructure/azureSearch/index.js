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
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

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

module.exports = {
  createIndex,
  updateIndex,
};

