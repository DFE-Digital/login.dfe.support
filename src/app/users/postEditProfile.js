const logger = require("../../infrastructure/logger");
const { sendResult } = require("../../infrastructure/utils");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");
const { updateInvitation } = require("login.dfe.api-client/invitations");

const { updateUser } = require("login.dfe.api-client/users");
const validate = (req) => {
  const validationMessages = {};
  let isValid = true;

  if (!req.body.firstName) {
    validationMessages.firstName = "Please specify a first name";
    isValid = false;
  }

  if (!req.body.lastName) {
    validationMessages.lastName = "Please specify a last name";
    isValid = false;
  }

  return {
    isValid,
    validationMessages,
  };
};

const updateUserIndex = async (uid, firstName, lastName, correlationId) => {
  const user = await getUserDetailsById(uid);
  user.name = `${firstName} ${lastName}`;
  user.firstName = firstName;
  user.lastName = lastName;

  await updateUserDetails(user, correlationId);

  await waitForIndexToUpdate(
    uid,
    (updated) =>
      updated.firstName === firstName && updated.lastName === lastName,
  );
};

const auditEdit = (req, user) => {
  const editedFields = [];

  if (req.body.firstName !== user.firstName) {
    editedFields.push({
      name: "given_name",
      oldValue: user.firstName,
      newValue: req.body.firstName,
    });
  }

  if (req.body.lastName !== user.lastName) {
    editedFields.push({
      name: "family_name",
      oldValue: user.lastName,
      newValue: req.body.lastName,
    });
  }

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) updated user ${user.email} (id: ${user.id})`,
    {
      type: "support",
      subType: "user-edit",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: user.id,
      editedFields,
    },
  );
};

const postEditProfile = async (req, res) => {
  const user = await getUserDetails(req);
  const validationResult = validate(req);
  if (!validationResult.isValid) {
    sendResult(req, res, "users/views/editProfile", {
      csrfToken: req.csrfToken(),
      backLink: "services",
      layout: "sharedViews/layout.ejs",
      currentPage: "users",
      user,
      validationMessages: validationResult.validationMessages,
    });
    return;
  }

  const uid = req.params.uid;
  if (uid.startsWith("inv-")) {
    const invitationId = uid.substr(4);

    await updateInvitation({
      invitationId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    await updateUserIndex(
      user.id,
      req.body.firstName,
      req.body.lastName,
      req.id,
    );
  } else {
    updateUser({
      userId: uid,
      update: {
        givenName: req.body.firstName,
        familyName: req.body.lastName,
      },
    });
    await updateUserIndex(uid, req.body.firstName, req.body.lastName, req.id);
  }

  auditEdit(req, user);

  return res.redirect("services");
};

module.exports = postEditProfile;
