const config = require("./../config");
const jwtStrategy = require("login.dfe.jwt-strategies");
const { fetchApi } = require("login.dfe.async-retry");

const updateUserServiceRequest = async (id, requestBody, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  return await fetchApi(
    `${config.access.service.url}/services/requests/${id}`,
    {
      method: "PATCH",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: requestBody,
    },
  );
};

module.exports = {
  updateUserServiceRequest,
};
