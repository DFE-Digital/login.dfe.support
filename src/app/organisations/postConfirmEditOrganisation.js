// const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const validateInput = async (name, address) => {
  let validationMessages = "";

  if (!name) {
    const nameRegEx = /^[^±!@£$%^*_+§¡€#¢§¶•ªº«\\/<>:;|=.~"]+$/i;
    validationMessages = "Please enter a name";
  } else if (!nameRegEx.test(name)) {
    validationMessages = "Special characters cannot be used";
  } else if (name.length > 256) {
    validationMessages = "Name cannot be longer than 256 characters";
  }

  if (address) {
    const addressRegex = /^[^±!@£$%^*_+§¡€#¢§¶•ªº«\\/<>:;|=.~"]+$/i;
    if (!addressRegex.test(address)) {
      validationMessages.address = "Special characters cannot be used";
    }
  }
};

const postConfirmEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { legalName, address } = req.session.formData;
  console.log("legalName: ", legalName);
  console.log("address: ", address);

  return res.redirect(`/organisations/${organisation.id}/users`);
};

module.exports = postConfirmEditOrganisation;
