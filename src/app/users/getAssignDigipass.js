const {getUserDetails} = require('./../users/utils');

const getAssignDigipass = async (req, res) => {
  let user;
  let isExistingUser = true;

  if (req.session.k2sUser) {
    user = req.session.k2sUser;
    isExistingUser = false;
  }

  if(req.params.uid) {
    user = await getUserDetails(req);
    req.session.user = user;
    req.session.digipassSerialNumberToAssign = '';
  }

  if(!user) {
    return res.redirect('../');
  }

  return res.render('users/views/assignDigipass', {
    csrfToken: req.csrfToken(),
    user,
    serialNumber: req.session.digipassSerialNumberToAssign ? req.session.digipassSerialNumberToAssign : '',
    validationMessages: {},
    isExistingUser,
  })
};

module.exports = getAssignDigipass;
