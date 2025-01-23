const { sendResult } = require("./../../infrastructure/utils");
const { getUserDetails } = require("./utils");
const { getLegacyUsernames } = require("./../../infrastructure/directories");
const {
  getUserOrganisations,
} = require("./../../infrastructure/organisations");

const getSecureDetails = async (req, res) => {
  const user = await getUserDetails(req);
  const userOrganisations = await getUserOrganisations(req.params.uid, req.id);
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
