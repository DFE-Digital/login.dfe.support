const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const { getUsersById } = require('./../../infrastructure/directories');
const logger = require('./../../infrastructure/logger');
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');

const getApproverDetails = async (organisations, correlationId) => {
  const allApproverIds = flatten(organisations.map((org) => org.approvers));
  const distinctApproverIds = uniq(allApproverIds);
  if (distinctApproverIds.length === 0) {
    return [];
  }
  return await getUsersById(distinctApproverIds, correlationId);
};


const getOrganisations = async (userId, correlationId) => {
  const orgMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getUserOrganisations(userId, correlationId);
  if (!orgMapping) {
    return [];
  }
  const allApprovers = await getApproverDetails(orgMapping, correlationId);
  if (!allApprovers) {
    return [];
  }

  const organisations = await Promise.all(orgMapping.map(async (invitation) => {
    const approvers = invitation.approvers.map((approverId) => {
      return allApprovers.find(x => x.sub.toLowerCase() === approverId.toLowerCase());
    }).filter(x => x);
    return {
      id: invitation.organisation.id,
      name: invitation.organisation.name,
      role: invitation.role,
      urn: invitation.organisation.urn,
      uid: invitation.organisation.uid,
      ukprn: invitation.organisation.ukprn,
      approvers,
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
