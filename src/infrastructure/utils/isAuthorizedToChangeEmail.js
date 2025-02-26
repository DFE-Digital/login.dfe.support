const isInternalEntraUser = require("./isInternalEntraUser");
const Account = require("./../../infrastructure/directories");

// Middleware to check if user is authorized to
// change their email or password
const isAuthorizedToChangeEmail = async (req, res, next) => {
  try {
    const userId = req.params?.uid;
    if (!userId) {
      return res.status(401).render("errors/views/notAuthorised");
    }
    const user = await Account.getUser(userId);

    // If the user is an internal DSI user and has migrated to Entra,
    // they are not allowed to change their email
    if (isInternalEntraUser(user)) {
      return res.status(401).render("errors/views/notAuthorised");
    }
    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = isAuthorizedToChangeEmail;
