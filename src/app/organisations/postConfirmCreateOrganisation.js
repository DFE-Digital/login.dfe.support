const logger = require('../../infrastructure/logger');

const postCreateOrganisation = async (req, res) => {
  // TODO Do we need to validate again?  Do we just get the data from the session? That
  // way can guarantee it's not been tampered with.

  console.log('Verify data is still in session?');
  console.log('Hit organisations API to create new record');
  console.log('Flash a success message');
  console.log('Clear out session data');
  return res.redirect('/');
};

module.exports = postCreateOrganisation;
