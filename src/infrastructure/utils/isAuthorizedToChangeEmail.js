const isInternalEntraUser = require("./isInternalEntraUser");
const Account = require("./../../infrastructure/directories");

// Middleware to check if a user's email is authorized to be changed
const isAuthorizedToChangeEmail = async (req, res, next) => {
  try {
    const userId = req.params?.uid;
    if (!userId) {
      return res.status(401).render("errors/views/notAuthorised");
    }
    const user = await Account.getUser(userId);

    // If the user is an internal DSI user who has been migrated to Entra, 
    // their email address should not be authorized for change
    if (isInternalEntraUser(user)) {
      return res.status(401).render("errors/views/notAuthorised");
    }
    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = isAuthorizedToChangeEmail;
