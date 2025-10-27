const { sendResult } = require("./../../infrastructure/utils");
const { getUserDetails } = require("./utils");
const {
  getLegacyUsernamesRaw,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");

const getSecureDetails = async (req, res) => {
  const user = await getUserDetails(req);
  const userOrganisations = await getUserOrganisationsWithServicesRaw({
    userId: req.params.uid,
  });
  const secureAccessDetails = await getLegacyUsernamesRaw({
    userId: req.params.uid,
  });
  sendResult(req, res, "users/views/secureAccessDetails", {
    csrfToken: req.csrfToken(),
    user,
    secureAccessDetails,
    currentPage: "users",
    isInvitation: req.params.uid.startsWith("inv-"),
    organisations: userOrganisations,
  });
};

module.exports = getSecureDetails;
