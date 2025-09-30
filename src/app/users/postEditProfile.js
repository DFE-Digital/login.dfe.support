const logger = require("../../infrastructure/logger");
const { sendResult } = require("../../infrastructure/utils");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");
const {
  updateUser,
  updateInvite,
} = require("../../infrastructure/directories");
const {
  putSingleServiceIdentifierForUser,
} = require("../../infrastructure/access");

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

  // k2s isn't used anymore so this section should be removed in the future
  const uid = req.params.uid;
  const idKey = "k2s-id";
  //todo k2s-id set id
  if (req.body.orgId && req.body.serviceId) {
    const identifierResult = await putSingleServiceIdentifierForUser(
      uid,
      req.body.serviceId,
      req.body.orgId,
      idKey,
      req.body.ktsId,
      req.id,
    );

    if (!identifierResult) {
      sendResult(req, res, "users/views/editProfile", {
        csrfToken: req.csrfToken(),
        user,
        backLink: "services",
        layout: "sharedViews/layout.ejs",
        currentPage: "users",
        isValid: false,
        validationMessages: {
          ktsId: "Key to Success ID is already in use",
        },
      });
      return;
    }
  }

  if (uid.startsWith("inv-")) {
    const invitationId = uid.substr(4);
    const newName = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };

    await updateInvite(invitationId, newName);
    await updateUserIndex(
      user.id,
      req.body.firstName,
      req.body.lastName,
      req.id,
    );
  } else {
    await updateUser(uid, req.body.firstName, req.body.lastName, req.id);
    await updateUserIndex(uid, req.body.firstName, req.body.lastName, req.id);
  }

  auditEdit(req, user);

  return res.redirect("services");
};

module.exports = postEditProfile;
