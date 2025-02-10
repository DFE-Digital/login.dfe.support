const { editOrganisation } = require("../../infrastructure/organisations");

const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const postConfirmEditOrganisation = async (req, res) => {
  console.log("postConfirmEditOrganisation called");
  const correlationId = req.id;
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.session.formData;
  console.log("name: ", name);
  console.log("address: ", address);

  //todo compare existing org details to new details, if different add to
  //todo body, or just keep original?

  console.log(organisation.name);
  console.log(organisation.address);

  const body = {
    name: name,
    address: address,
  };

  await editOrganisation(organisation.id, body, correlationId);

  return res.redirect(`/organisations/${organisation.id}/users`);
};

module.exports = postConfirmEditOrganisation;
