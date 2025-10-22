const logger = require("../../infrastructure/logger");
const { deleteUserVerificationCode } = require("login.dfe.api-client/users");

const {
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");

const updateUserIndex = async (uid) => {
  const user = await getUserDetailsById(uid);
  user.pendingEmail = null;

  await updateUserDetails(user);

  await waitForIndexToUpdate(uid, (updated) => !updated.pendingEmail);
};

const postCancelChangeEmail = async (req, res) => {
  const user = await getUserDetailsById(req);

  await deleteUserVerificationCode({
    userId: req.params.uid,
    verificationCodeType: "changeemail",
  });
  await updateUserIndex(req.params.uid);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) cancelled the change of email for ${user.email} (id: ${user.id}) to email ${user.pendingEmail}`,
    {
      type: "support",
      subType: "user-editemail",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: user.id,
      editedFields: [
        {
          name: "new_email",
          oldValue: user.pendingEmail,
          newValue: "",
        },
      ],
    },
  );

  return res.redirect("services");
};

module.exports = postCancelChangeEmail;
