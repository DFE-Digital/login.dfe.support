const { sendResult } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const validateInput = async (req) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.body;
  const regex = /[±!@£$%^*_+§¡€#¢§¶•ªº«\\/<>:;|=.~"]/;
  const model = {
    csrfToken: req.csrfToken(),
    backlink: "users",
    organisation,
    validationMessages: {},
  };

  if (organisation.category.id && organisation.category.id !== "008") {
    model.validationMessages.name = `You cannot edit ${organisation.category.name} organisations`;
  }

  if (!name.trim() && !address.trim()) {
    model.validationMessages.name =
      "Please update at least one of Name or Address.";
  } else if (
    (name.trim() && regex.test(name)) ||
    (address.trim() && regex.test(address))
  ) {
    model.validationMessages.name = "Special characters cannot be used";
  }

  return model;
};

const postEditOrganisation = async (req, res) => {
  const model = await validateInput(req);

  if (model.validationMessages.name !== undefined) {
    sendResult(req, res, "organisations/views/editOrganisation", model);
    return;
  } else {
    const { name, address } = req.body;
    req.session.editOrgFormData = { name, address };

    // Save the session explicitly
    req.session.save((err) => {
      if (err) {
        // Any error saving to session should hopefully be temporary. Assuming this, we log the error
        // and just display an error message saying to try again.
        logger.error("An error occurred when saving to the session", err);
        model.validationMessages.name =
          "Something went wrong submitting data, please try again";

        return sendResult(
          req,
          res,
          "organisations/views/editOrganisation",
          model,
        );
      }
      // Redirect after successfully saving the session
      res.redirect(`/organisations/${req.params.id}/confirm-edit-organisation`);
    });
  }
};

module.exports = postEditOrganisation;
