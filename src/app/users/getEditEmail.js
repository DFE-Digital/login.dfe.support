const { sendResult } = require("./../../infrastructure/utils");
const { getUserDetails } = require("./utils");

const getEditEmail = async (req, res) => {
  const user = await getUserDetails(req);

  sendResult(req, res, "users/views/editEmail", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    user,
    backLink: "services",
    email: user.email,
    validationMessages: {},
  });
};

module.exports = getEditEmail;
