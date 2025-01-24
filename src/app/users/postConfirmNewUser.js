const { createInvite } = require("../../infrastructure/directories");
const {
  addInvitationOrganisation,
  getOrganisationById,
} = require("../../infrastructure/organisations");
const { createIndex } = require("../../infrastructure/search");
const { waitForIndexToUpdate } = require("./utils");
const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");

const postConfirmNewUser = async (req, res) => {
  let emailOverrides = {};
  let clientId;
  let redirectUri;
  let clientOverrides = req.body["invite-destination"].split("{split}");

  if (req.body["email-contents-choice"] !== "Approve") {
    emailOverrides.subject = req.body["email-subject"];
    emailOverrides.body = req.body["email-contents"];
  }

  if (req.body["redirect-choice"] !== "Approve") {
    clientId = clientOverrides[0];
    redirectUri = clientOverrides[1];
  } else {
    clientId = "services";
    redirectUri = `${config.hostingEnvironment.servicesUrl}/auth/cb`;
  }
  let organisation = null;
  if (req.session.user.organisationId) {
    organisation = await getOrganisationById(
      req.session.user.organisationId,
      req.id,
    );
  }

  const invitationId = await createInvite(
    req.session.user.firstName,
    req.session.user.lastName,
    req.session.user.email,
    clientId,
    redirectUri,
    req.id,
    emailOverrides,
    req.session.user.permission,
    organisation ? organisation.name : null,
  );

  if (invitationId) {
    logger.audit({
      type: "support",
      subType: "invite-created",
      userId: req.user.sub,
      message: `Invitation code is created. Id ${invitationId}`,
    });
  }

  if (req.session.user.organisationId) {
    await addInvitationOrganisation(
      invitationId,
      req.session.user.organisationId,
      req.session.user.permission || 0,
      req.id,
    );
  }

  await createIndex(`inv-${invitationId}`, req.id);

  await waitForIndexToUpdate(`inv-${invitationId}`);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) invited ${req.session.user.email}`,
    {
      type: "support",
      subType: "user-invited",
      userId: req.user.sub,
      userEmail: req.user.email,
      invitedUserEmail: req.session.user.email,
    },
  );

  res.flash(
    "info",
    `${req.session.user.firstName} ${req.session.user.lastName} has been invited`,
  );
  return res.redirect(`/users/inv-${invitationId}`);
};

module.exports = postConfirmNewUser;
