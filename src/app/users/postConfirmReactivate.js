const logger = require("../../infrastructure/logger");
const {
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
} = require("./utils");
const { activateUser } = require("login.dfe.api-client/users");

const updateUserIndex = async (req) => {
  const user = await getUserDetailsById(req.params.uid, req);
  user.status = {
    id: 1,
    description: "Active",
  };

  await updateUserDetails(user);

  await waitForIndexToUpdate(
    req.params.uid,
    (updated) => updated.status.id === 1,
  );
};

const postConfirmReactivate = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid, req);

  await activateUser({ userId: req.params.uid });
  await updateUserIndex(req);

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
