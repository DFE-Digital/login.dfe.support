const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");

//Poc work
const { DefaultAzureCredential } = require("@azure/identity");
const { SearchClient, SearchIndexClient } = require("@azure/search-documents");

const credential = new DefaultAzureCredential(config.cache.params.serviceName);
const client = new SearchIndexClient(`https://${config.cache.params.serviceName}.search.windows.net`, credential);

const getIndexes = async () => {
  const searchResults = await client.indexes.search("*")
  // Output documents
  for await (const result of searchResults.results) {
    console.log(result.document);
  }
  return searchResults
  
  // fetchApi(getAzureSearchUri(), {
  //   method: "GET",
  //   headers: {
  //     "api-key": config.cache.params.apiKey,
  //   },
  // });
};

const getAzureSearchUri = (indexName, indexResource = "") => {
  let indexUriSegments = "";
  if (indexName) {
    indexUriSegments = `/${indexName}${indexResource}`;
  }
  return `https://${config.cache.params.serviceName}.search.windows.net/indexes${indexUriSegments}?api-version=2016-09-01`;
};




const createIndex = async (indexName, fields) => {
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
};

const updateIndex = async (users, index) => {
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
};

const deleteIndexItem = async (item, index) => {
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
