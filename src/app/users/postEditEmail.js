const { emailPolicy } = require("login.dfe.validation");
const logger = require("../../infrastructure/logger");
const { sendResult } = require("../../infrastructure/utils");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");
const {
  getUser,
  createChangeEmailCode,
  updateInvite,
  getChangeEmailCode,
  deleteChangeEmailCode,
} = require("../../infrastructure/directories");

const validate = async (req) => {
  const model = {
    email: req.body.email || "",
    validationMessages: {},
    layout: "sharedViews/layoutNew.ejs",
    backLink: "services",
  };

  if (!model.email || model.email.trim().length === 0) {
    model.validationMessages.email = "Please enter email address";
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.validationMessages.email = "Please enter a valid email address";
  } else if (await getUser(model.email, req.id)) {
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

const updateUserIndex = async (uid, pendingEmail, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);
  user.pendingEmail = pendingEmail;

  await updateUserDetails(user, correlationId);

  await waitForIndexToUpdate(
    uid,
    (updated) => updated.pendingEmail === pendingEmail,
  );
};
const updateUserEmail = async (req, model, user) => {
  const user_code = await getChangeEmailCode(user.id, req.id);

  if (user_code && !codeExpiry(user_code.updatedAt)) {
    await deleteChangeEmailCode(user.id, req.id);
  }
  await createChangeEmailCode(user.id, model.email, "support", "na", req.id);

  await updateUserIndex(user.id, model.email, req.id);

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

const updateInvitationIndex = async (uid, newEmail, correlationId) => {
  const user = await getUserDetailsById(uid, correlationId);

  user.email = newEmail;

  await updateUserDetails(user);

  await waitForIndexToUpdate(
    uid,
    (updated) => (updated ? updated.email : "") === newEmail,
  );
};
const updateInvitationEmail = async (req, model, user) => {
  const invitationId = req.params.uid.substr(4);
  const newEmail = {
    email: model.email,
  };

  await updateInvite(invitationId, newEmail);
  await updateInvitationIndex(user.id, model.email, req.id);

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
  const user = await getUserDetails(req);

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
