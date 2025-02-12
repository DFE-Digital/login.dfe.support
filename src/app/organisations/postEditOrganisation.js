const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const postEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.body;

  const view = "organisations/views/editOrganisation";
  const regex = /[±!@£$%^*_+§¡€#¢§¶•ªº«\\/<>:;|=.~"]/;
  const model = {
    csrfToken: req.csrfToken(),
    organisation,
    validationMessages: {},
  };

  if (!name.trim() && !address.trim()) {
    model.validationMessages.name =
      "Please update at least one of Name or Address.";

    sendResult(req, res, view, model);
    return;
  }

  if (name.trim() && regex.test(name)) {
    model.validationMessages.name = "Special characters cannot be used";

    sendResult(req, res, view, model);
    return;
  }

  if (address.trim() && regex.test(address)) {
    model.validationMessages.name = "Special characters cannot be used";

    sendResult(req, res, view, model);
    return;
  }

  req.session.formData = { name, address };

  return res.redirect(
    `/organisations/${organisation.id}/confirm-edit-organisation`,
  );
};

module.exports = postEditOrganisation;
