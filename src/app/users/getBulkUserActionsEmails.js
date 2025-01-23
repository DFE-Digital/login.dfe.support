/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { searchForBulkUsersPage } = require("./utils");

const getBulkUserActionsEmails = async (req, res) => {
  const emails = req.session.emails;
  if (!emails) {
    return res.redirect("/users");
  }
  const users = [];

  const emailsArray = emails.split(",");
  for (const email of emailsArray) {
    const result = await searchForBulkUsersPage(email.trim());
    for (const user of result.users) {
      let emailNotDuplicate = true;
      // Loop over every user we've found to see if there's a duplicate.  If so, skip it and move on.
      users.find((o) => {
        if (o.email === user.email) {
          emailNotDuplicate = false;
          return true; // Stop searching now that we know there's a duplicate
        }
      });
      if (emailNotDuplicate) {
        users.push(user);
      }
    }
  }

  const model = {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    backLink: "../bulk-user-actions",
    currentPage: "users",
    users,
    validationMessages: {},
  };

  res.render("users/views/bulkUserActionsEmails", model);
};

module.exports = getBulkUserActionsEmails;
