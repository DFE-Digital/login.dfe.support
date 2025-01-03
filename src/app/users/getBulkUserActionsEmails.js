/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { searchForBulkUsersPage } = require('./utils');
const { sendResult } = require('../../infrastructure/utils');

const getBulkUserActionsEmails = async (req, res) => {
  const emails = req.session.emails;
  if (!emails) {
    return res.redirect('/users');
  }
  const users = [];

  const emailsArray = emails.split(',');
  for (const email of emailsArray) {
    const result = await searchForBulkUsersPage(email.trim());
    for (const user of result.users) {
      users.push(user);
    }
  }

  const model = {
    csrfToken: req.csrfToken(),
    layout: 'sharedViews/layoutNew.ejs',
    users,
    validationMessages: {},
  };

  res.render('users/views/bulkUserActionsEmails', model);
};

module.exports = getBulkUserActionsEmails;
