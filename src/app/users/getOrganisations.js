const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const logger = require('./../../infrastructure/logger');

const getOrganisations = async (userId, correlationId) => {
  const orgMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getUserOrganisations(userId, correlationId);
  if (!orgMapping) {
    return [];
  }

  const organisations = await Promise.all(orgMapping.map(async (invitation) => {
    return {
      id: invitation.organisation.id,
      name: invitation.organisation.name,
    };
  }));

  return organisations;
};

const action = async (req, res) => {
  const user = await getUserDetails(req);
  const organisationDetails = await getOrganisations(user.id, req.id);

  const organisations = [];
  for (let i = 0; i < organisationDetails.length; i++) {
    const org = organisationDetails[i];
    organisations.push(org);
  }

  req.session.user = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

  logger.audit(`${req.user.email} (id: ${req.user.sub}) viewed user ${user.email} (id: ${user.id})`, {
    type: 'organisations',
    subType: 'user-view',
    userId: req.user.sub,
    userEmail: req.user.email,
    viewedUser: user.id,
  });

  sendResult(req, res, 'users/views/organisations', {
    csrfToken: req.csrfToken(),
    user,
    organisations,
    isInvitation: req.params.uid.startsWith('inv-'),
  });
};

module.exports = action;