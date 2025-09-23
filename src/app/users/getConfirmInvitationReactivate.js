const { sendResult } = require("./../../infrastructure/utils");

const getConfirmInvitationReactivate = async (req, res) => {
  sendResult(req, res, "users/views/confirmInvitationReactivate", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    backLink: "services",
  });
};

module.exports = getConfirmInvitationReactivate;
