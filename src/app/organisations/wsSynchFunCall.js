const { fetchApi } = require("login.dfe.async-retry");

const wsSyncCall = async (orgId) => {
  if (!orgId) {
    return undefined;
  }
  try {
    const client = await fetchApi(
      `${process.env.WSORG_SYNC_URL}&orgId=${orgId}`,
      {
        method: "GET",
      },
    );
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  wsSyncCall,
};
