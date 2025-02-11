const { editOrganisation } = require("../../infrastructure/organisations");

const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const postConfirmEditOrganisation = async (req, res) => {
  const correlationId = req.id;
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.session.formData;

  const body = {
    name: name,
    address: address,
  };

  await editOrganisation(organisation.id, body, correlationId);

  res.flash("info", "Organisation details updated");
  req.session.formData = undefined;

  return res.redirect(`/organisations/${organisation.id}/users`);
};

module.exports = postConfirmEditOrganisation;
