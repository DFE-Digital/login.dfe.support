const { updateUserInSearchIndex } = require("login.dfe.api-client/users");

const updateUserSearchIndex = async (id) => {
  try {
    return await updateUserInSearchIndex({ id });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404 || status === 400 || status === 403) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  updateUserSearchIndex,
};
