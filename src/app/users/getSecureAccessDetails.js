const { sendResult } = require("./../../infrastructure/utils");
const { getUserDetailsById } = require("./utils");
const { getLegacyUsernames } = require("./../../infrastructure/directories");
const {
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");

const getSecureDetails = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid, req);
  const userOrganisations = await getUserOrganisationsWithServicesRaw({
    userId: req.params.uid,
  });
  const secureAccessDetails = await getLegacyUsernames(req.params.uid, req.id);
  sendResult(req, res, "users/views/secureAccessDetails", {
    csrfToken: req.csrfToken(),
    user,
    secureAccessDetails,
    isInvitation: req.params.uid.startsWith("inv-"),
    organisations: userOrganisations,
  });
};

module.exports = getSecureDetails;
