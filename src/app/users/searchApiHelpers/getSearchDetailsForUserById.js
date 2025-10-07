const { searchUserByIdRaw } = require("login.dfe.api-client/users");
const { mapSearchUserToSupportModel } = require("../utils");

const getSearchDetailsForUserById = async (id) => {
  try {
    const user = await searchUserByIdRaw({ userId: id });
    return user ? mapSearchUserToSupportModel(user) : undefined;
  } catch (e) {
    throw new Error(`Error getting user ${id} from search - ${e.message}`);
  }
};
module.exports = {
  getSearchDetailsForUserById,
};
