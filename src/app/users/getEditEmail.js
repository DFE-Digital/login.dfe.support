const { sendResult } = require("./../../infrastructure/utils");
const { getUserDetailsById } = require("./utils");

const getEditEmail = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid, req);

  sendResult(req, res, "users/views/editEmail", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    user,
    backLink: "services",
    currentPage: "users",
    email: user.email,
    validationMessages: {},
  });
};

module.exports = getEditEmail;
