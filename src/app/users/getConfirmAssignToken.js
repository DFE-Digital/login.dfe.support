const {getUserOrganisations} = require('./../../infrastructure/organisations');

const getConfirmAssignDigipass = async (req, res) => {

  let isExistingUser = true;
  if(req.session.k2sUser) {
    isExistingUser = false;
  }

  const userOrgs = await getUserOrganisations(req.params.uid, req.id);

  const org = userOrgs.find(org => org.organisation.id.toLowerCase() === req.session.user.orgId.toLowerCase());

  return res.render('users/views/confirmDigipass', {
    csrfToken: req.csrfToken(),
    userId: req.params.uid,
    email: req.session.user.email,
    user: req.session.user,
    orgName: org.organisation.name,
    serialNumber: req.session.digipassSerialNumberToAssign,
    validationMessages: {},
    isExistingUser: isExistingUser
  })
};

module.exports = getConfirmAssignDigipass;
