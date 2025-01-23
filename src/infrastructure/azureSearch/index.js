"use strict";

const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");

const getAzureSearchUri = (indexName, indexResource = "") => {
  let indexUriSegments = "";
  if (indexName) {
    indexUriSegments = `/${indexName}${indexResource}`;
  }
  return `https://${config.cache.params.serviceName}.search.windows.net/indexes${indexUriSegments}?api-version=2016-09-01`;
};

const createIndex = async (indexName, fields) => {
  try {
    await fetchApi(getAzureSearchUri(indexName), {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "api-key": config.cache.params.apiKey,
      },
      body: {
        name: indexName,
        fields,
      },
    });
    return indexName;
  } catch (e) {
    throw e;
  }
};

const updateIndex = async (users, index) => {
  try {
    await fetchApi(getAzureSearchUri(index, "/docs/index"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-key": config.cache.params.apiKey,
      },
      body: {
        value: users,
      },
    });
  } catch (e) {
    throw e;
  }
};

const deleteIndexItem = async (item, index) => {
  try {
    await fetchApi(getAzureSearchUri(index, "/docs/index"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-key": config.cache.params.apiKey,
      },
      body: {
        value: item,
      },
    });
  } catch (e) {
    throw e;
  }
};

const deleteUnusedIndexes = async (unusedIndexes, currentIndexName) => {
  for (let i = 0; i < unusedIndexes.length; i++) {
    if (unusedIndexes[i] !== currentIndexName) {
      try {
        await fetchApi(getAzureSearchUri(unusedIndexes[i]), {
          method: "DELETE",
          headers: {
            "api-key": config.cache.params.apiKey,
          },
        });
      } catch (e) {
        if (e.statusCode !== 404) {
          throw e;
        }
      }
    }
  }
};

const getIndexes = async () => {
  return await fetchApi(getAzureSearchUri(), {
    method: "GET",
    headers: {
      "api-key": config.cache.params.apiKey,
    },
  });
};

const getIndexById = async (currentIndexName, userId, filterParam = "id") => {
  const response = await fetchApi(
    `${getAzureSearchUri(currentIndexName, "/docs")}&$filter=${filterParam}+eq+'${userId}'`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "api-key": config.cache.params.apiKey,
      },
    },
  );

  if (response.value.length === 0) {
    return null;
  }

  return response.value[0];
};

const search = async (currentIndexName, criteria, skip, pageSize, orderBy) => {
  return await fetchApi(
    `${getAzureSearchUri(currentIndexName, "/docs")}&search=${encodeURIComponent(criteria)}&$count=true&$skip=${skip}&$top=${pageSize}&$orderby=${orderBy}`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "api-key": config.cache.params.apiKey,
      },
    },
  );
};

module.exports = {
  createIndex,
  updateIndex,
  deleteUnusedIndexes,
  getIndexes,
  search,
  getIndexById,
  deleteIndexItem,
};
