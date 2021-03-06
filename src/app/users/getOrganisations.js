const { sendResult } = require('./../../infrastructure/utils');
const { getUserDetails } = require('./utils');
const { getUserOrganisations, getInvitationOrganisations, getPendingRequestsAssociatedWithUser } = require('./../../infrastructure/organisations');
const { getUsersByIdV2 } = require('./../../infrastructure/directories');
const logger = require('./../../infrastructure/logger');
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const sortBy = require('lodash/sortBy');

const getApproverDetails = async (organisations, correlationId) => {
  const allApproverIds = flatten(organisations.map((org) => org.approvers));
  const distinctApproverIds = uniq(allApproverIds);
  if (distinctApproverIds.length === 0) {
    return [];
  }
  return await getUsersByIdV2(distinctApproverIds, correlationId);
};


const getOrganisations = async (userId, correlationId) => {
  const orgMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getUserOrganisations(userId, correlationId);
  if (!orgMapping) {
    return [];
  }
  const allApprovers = await getApproverDetails(orgMapping, correlationId);

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
      status: invitation.organisation.status,
      numericIdentifier: invitation.numericIdentifier,
      textIdentifier: invitation.textIdentifier,
      approvers,
    };
  }));

  return organisations;
};

const getPendingRequests = async (userId, correlationId) => {
  const pendingUserRequests = await getPendingRequestsAssociatedWithUser(userId, correlationId) || [];
  return pendingUserRequests.map((request) => ({
    id: request.org_id,
    name: request.org_name,
    urn: request.urn,
    ukprn: request.ukprn,
    uid: request.uid,
    status: request.org_status,
    requestDate: request.created_date,
    requestId: request.id,
  }))
};

const action = async (req, res) => {
  const user = await getUserDetails(req);
  const organisationDetails = await getOrganisations(user.id, req.id);
  const organisationRequests = !user.id.startsWith('inv-') ? await getPendingRequests(user.id, req.id) : [];
  const allOrgs = organisationDetails.concat(organisationRequests);
  const sortedOrgs = sortBy(allOrgs, 'name');

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
    organisations: sortedOrgs,
    isInvitation: req.params.uid.startsWith('inv-'),
  });
};

module.exports = action;
