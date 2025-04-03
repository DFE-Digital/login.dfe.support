const {
  getUserOrganisationsV2,
  getInvitationOrganisations,
} = require("./../../infrastructure/organisations");

const getSelectionPrompt = async () => {
  return "You are associated with more than one organisation. Select the organisation associated with the service you would like to access.";
};

const getNaturalIdentifiers = async (req) => {
  const userId = req.params.uid;
  const userOrganisations = userId.startsWith("inv-")
    ? await getInvitationOrganisations(userId.substr(4), req.id)
    : await getUserOrganisationsV2(req.params.uid, req.id);
  for (let i = 0; i < userOrganisations.length; i++) {
    const org = userOrganisations[i];
    if (org.organisation) {
      org.naturalIdentifiers = [];
      const urn = org.organisation.urn;
      const uid = org.organisation.uid;
      const upin = org.organisation.upin;
      const ukprn = org.organisation.ukprn;
      if (urn) {
        org.naturalIdentifiers.push(`URN: ${urn}`);
      }
      if (uid) {
        org.naturalIdentifiers.push(`UID: ${uid}`);
      }
      if (upin) {
        org.naturalIdentifiers.push(`UPIN: ${upin}`);
      }
      if (ukprn) {
        org.naturalIdentifiers.push(`UKPRN: ${ukprn}`);
      }
    }
  }
  return userOrganisations;
};

const clearServiceSessionData = (req) => {
  if (req.session.user.services) {
    req.session.user.services = undefined;
  }
};

const get = async (req, res) => {
  clearServiceSessionData(req);
  const userOrganisations = await getNaturalIdentifiers(req);
  if (userOrganisations.length === 1) {
    return res.redirect(
      `organisations/${userOrganisations[0].organisation.id}`,
    );
  }
  console.log("userOrganisations: ", userOrganisations);
  return res.render("users/views/selectOrganisation", {
    selectionPrompt: getSelectionPrompt(),
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    backLink: "organisations",
    organisations: userOrganisations,
    selectedOrganisation: null,
    validationMessages: {},
  });
};

const validate = async (req) => {
  const userOrganisations = await getNaturalIdentifiers(req);
  const selectedOrg = req.body.selectedOrganisation;
  const model = {
    selectedOrganisation: selectedOrg,
    layout: "sharedViews/layoutNew.ejs",
    validationMessages: {},
    organisations: userOrganisations,
  };

  if (
    model.selectedOrganisation === undefined ||
    model.selectedOrganisation === null
  ) {
    model.validationMessages.selectedOrganisation =
      "Please select an organisation";
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("users/views/selectOrganisation", model);
  }
  return res.redirect(
    `/users/${req.params.uid}/organisations/${model.selectedOrganisation}`,
  );
};

module.exports = {
  get,
  post,
};
