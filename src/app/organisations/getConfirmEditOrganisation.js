const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const getConfirmEditOrganisation = async (req, res) => {
  if (!req.session.formData) {
    return res.redirect("/organisations");
  }
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.session.formData;

  // const validationMessage = "";
  const regex = /[±!@£$%^*_+§¡€#¢§¶•ªº«\\/<>:;|=.~"]/;

  if (name && !regex.test(name)) {
    console.log("name: ", name);
  }

  if (name.trim() === "" && address.trim() === "") {
    sendResult(req, res, "organisations/views/editOrganisation", {
      csrfToken: req.csrfToken(),
      organisation,
      validationMessages: {
        name: "Please update at least one of Name or Address.",
      },
    });
  } else {
    sendResult(req, res, "organisations/views/confirmEditOrganisation", {
      csrfToken: req.csrfToken(),
      organisation,
      name,
      address,
      validationMessages: {},
    });
  }
};

module.exports = getConfirmEditOrganisation;
