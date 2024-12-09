const getBulkUserActionsEmails = (req, res) => {
  // Get the email list from the session
  const emails = req.session.emails;
  const users = [];
  console.log(emails);

  const emailsArray = emails.split(',');
  // eslint-disable-next-line no-restricted-syntax
  for (const email of emailsArray) {
    console.log(email);
    // Search index for the email
    // if (user exists) {
    users.push(
      {
        name: 'Timmy Tester',
        email: 'timmy@tester.test',
        organisation: {
          name: 'Testco',
        },
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        status: {
          description: 'Active',
        },
      },
    );
  }

  const model = {
    csrfToken: req.csrfToken(),
    users,
    validationMessages: {},
  };

  res.render('users/views/bulkUserActionsEmails', model);
};

module.exports = getBulkUserActionsEmails;
