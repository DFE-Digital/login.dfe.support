const getBulkUserActionsEmails = (req, res) => {
  // Get the email list from the session
  // const emails = req.session.emails;
  const emailsForPage = [];
  console.log(req.session.emails);
  // Split the comma separated list into array of emails
  // For (email in emails) {
  // Search index for the email
  // if (user exists) {
  //     push onto emailsForPage
  // }
  // }
  const model = {
    csrfToken: req.csrfToken(),
    emailsForPage,
    validationMessages: {},
  };

  res.render('users/views/bulkUserActionsEmails', model);
};

module.exports = getBulkUserActionsEmails;
