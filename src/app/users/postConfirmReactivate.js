const logger = require("../../infrastructure/logger");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");
const { activateUser } = require("login.dfe.api-client/users");

const updateUserIndex = async (uid) => {
  const user = await getUserDetailsById(uid);
  user.status = {
    id: 1,
    description: "Active",
  };

  await updateUserDetails(user);

  await waitForIndexToUpdate(uid, (updated) => updated.status.id === 1);
};

const postConfirmReactivate = async (req, res) => {
  const user = await getUserDetails(req);

  await activateUser({ userId: req.params.uid });
  await updateUserIndex(req.params.uid);

  // Audit
  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) reactivated user ${user.email} (id: ${user.id})`,
    {
      type: "support",
      subType: "user-edit",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: user.id,
      editedFields: [
        {
          name: "status",
          oldValue: user.status.id,
          newValue: 1,
        },
      ],
    },
  );

  res.flash("info", "The account has been reactivated");
  res.redirect("services");
};

module.exports = postConfirmReactivate;
