const flatten = require("lodash/flatten");
const uniq = require("lodash/uniq");
const { sendResult } = require("./../../infrastructure/utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const {
  mapStatusForSupport,
  userStatusMap,
  requestTypeMap,
  unpackMultiSelect,
  search,
} = require("./utils");
const { getUsersRaw } = require("login.dfe.api-client/users");

const getUserDetails = async (usersForApproval) => {
  const allUserId = flatten(usersForApproval.map((user) => user.user_id));
  if (allUserId.length === 0) {
    return [];
  }
  const distinctUserIds = uniq(allUserId);
  return await getUsersRaw({ by: { userIds: distinctUserIds } });
};

const getFiltersModel = async (req) => {
  const paramsSource = req.method === "POST" ? req.body : req.query;
  let showFilters = false;
  if (
    paramsSource.showFilters !== undefined &&
    paramsSource.showFilters.toLowerCase() === "true"
  ) {
    showFilters = true;
  }

  const selectedRequestStatuses = unpackMultiSelect(paramsSource.status);
  const requestStatuses = userStatusMap.map((status) => {
    return {
      id: status.id,
      name: status.name,
      isSelected:
        selectedRequestStatuses.find((x) => x === status.id.toString()) !==
        undefined,
    };
  });

  const selectedRequestTypes = unpackMultiSelect(paramsSource.requestType);
  const requestTypes = requestTypeMap.map((type) => {
    return {
      id: type.id,
      name: type.name,
      isSelected: selectedRequestTypes.find((x) => x === type.id) !== undefined,
    };
  });

  const searchEmail = paramsSource.searchEmail
    ? paramsSource.searchEmail.trim()
    : "";

  return {
    showFilters,
    requestStatuses,
    requestTypes,
    searchEmail,
  };
};

const buildModel = async (req) => {
  const result = await search(req);
  const userList = await getUserDetails(result.accessRequests);
  const requests = result.accessRequests.map((user) => {
    const userFound = userList.find(
      (c) => c.sub.toLowerCase() === user.user_id.toLowerCase(),
    );
    const usersEmail = userFound ? userFound.email : "";
    const usersName = userFound
      ? `${userFound.given_name} ${userFound.family_name}`
      : "No Name Supplied";
    const statusText = mapStatusForSupport(user.status);
    const formattedCreatedDate = user.created_date
      ? dateFormat(user.created_date, "shortDateFormat")
      : "";
    return Object.assign(
      { usersEmail },
      { usersName },
      { statusText },
      { formattedCreatedDate },
      user,
    );
  });

  const model = {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    currentPage: "users",
    title: "Requests - DfE Sign-in",

    requests,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    noUserFound: result.noUserFound || false,
  };

  const filtersModel = await getFiltersModel(req);

  return Object.assign(model, filtersModel);
};

const get = async (req, res) => {
  const model = await buildModel(req);
  sendResult(req, res, "accessRequests/views/organisationRequests", model);
};

const post = async (req, res) => {
  const model = await buildModel(req);
  sendResult(req, res, "accessRequests/views/organisationRequests", model);
};

module.exports = {
  get,
  post,
};
