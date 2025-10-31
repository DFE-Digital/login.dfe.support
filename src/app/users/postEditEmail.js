const { emailPolicy } = require("login.dfe.validation");
const logger = require("../../infrastructure/logger");
const { sendResult } = require("../../infrastructure/utils");
const {
  getUserRaw,
  getUserVerificationCodeRaw,
  deleteUserVerificationCode,
  createUserVerificationCodeRaw,
} = require("login.dfe.api-client/users");

const {
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");

const { updateInvitation } = require("login.dfe.api-client/invitations");

const validate = async (req) => {
  const model = {
    email: req.body.email || "",
    validationMessages: {},
    layout: "sharedViews/layout.ejs",
    backLink: "services",
    currentPage: "users",
  };

  if (!model.email || model.email.trim().length === 0) {
    model.validationMessages.email = "Please enter email address";
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.validationMessages.email = "Please enter a valid email address";
  } else if (await getUserRaw({ by: { email: model.email } })) {
    model.validationMessages.email =
      "A DfE Sign-in user already exists with that email address";
  }

  return model;
};

const codeExpiry = (updatedAt) => {
  const date = new Date(updatedAt);
  const diff = Date.now() - 1000 * 60 * 60;
  return date > diff;
};

const updateUserIndex = async (uid, pendingEmail, req) => {
  const userToBeUpdated = await getUserDetailsById(uid, req);
  userToBeUpdated.pendingEmail = pendingEmail;

  await updateUserDetails(userToBeUpdated);

  await waitForIndexToUpdate(
    uid,
    (updated) => updated.pendingEmail === pendingEmail,
  );
};
const updateUserEmail = async (req, model, user) => {
  const user_code = await getUserVerificationCodeRaw({
    userId: user.id,
    verificationCodeType: "changeemail",
  });

  if (user_code && !codeExpiry(user_code.updatedAt)) {
    await deleteUserVerificationCode({
      userId: user.id,
      verificationCodeType: "changeemail",
    });
  }
  await createUserVerificationCodeRaw({
    userId: user.id,
    email: model.email,
    clientId: "support",
    redirectUri: "na",
    verificationCodeType: "changeemail",
    selfInvoked: false,
  });

  await updateUserIndex(user.id, model.email, req);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) initiated a change of email for ${user.email} (id: ${user.id}) to ${model.email}`,
    {
      type: "support",
      subType: "user-editemail",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: user.id,
      editedFields: [
        {
          name: "new_email",
          oldValue: user.email,
          newValue: model.email,
        },
      ],
    },
  );
};

const updateInvitationIndex = async (uid, newEmail, req) => {
  const userToBeUpdated = await getUserDetailsById(uid, req);

  userToBeUpdated.email = newEmail;

  await updateUserDetails(userToBeUpdated);

  await waitForIndexToUpdate(
    uid,
    (updated) => (updated ? updated.email : "") === newEmail,
  );
};
const updateInvitationEmail = async (req, model, user) => {
  const invitationId = req.params.uid.substr(4);

  await updateInvitation({
    invitationId,
    email: model.email,
  });
  await updateInvitationIndex(user.id, model.email, req);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) changed email on invitation for ${user.email} (id: ${user.id}) to ${model.email}`,
    {
      type: "support",
      subType: "user-invite-editemail",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: user.id,
      editedFields: [
        {
          name: "new_email",
          oldValue: user.email,
          newValue: model.email,
        },
      ],
    },
  );
};

const postEditEmail = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid, req);

  const model = await validate(req);
  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.user = user;
    return sendResult(req, res, "users/views/editEmail", model);
  }

  if (req.params.uid.startsWith("inv-")) {
    await updateInvitationEmail(req, model, user);
  } else {
    await updateUserEmail(req, model, user);
  }

  return res.redirect("services");
};

module.exports = postEditEmail;
