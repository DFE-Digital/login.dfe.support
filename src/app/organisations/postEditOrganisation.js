// const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const postEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.body;

  req.session.formData = { name, address };
  return res.redirect(
    `/organisations/${organisation.id}/confirm-edit-organisation`,
  );
};

module.exports = postEditOrganisation;
