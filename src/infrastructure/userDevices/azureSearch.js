'use strict';

const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');

const client = redis.createClient({
  url: config.cache.params.indexPointerConnectionString,
});

const setAsync = promisify(client.set).bind(client);


const updateActiveIndex = async (index) => {
  await setAsync('CurrentIndex_UserDevices', index)
};

module.exports = {
  createIndex,
  updateIndex,
  updateActiveIndex,
};

