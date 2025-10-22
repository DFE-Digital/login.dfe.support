const flatten = require("lodash/flatten");
const uniq = require("lodash/uniq");
const sortBy = require("lodash/sortBy");
const {
  sendResult,
  isInternalEntraUser,
} = require("../../infrastructure/utils");
const { getUserDetailsById } = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const {
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");
const {
  getPendingRequestsRaw,
  getUserOrganisationsWithServicesRaw,
  getUsersRaw,
  getUserStatusRaw,
} = require("login.dfe.api-client/users");
const logger = require("../../infrastructure/logger");

const getApproverDetails = async (organisations) => {
  const allApproverIds = flatten(organisations.map((org) => org.approvers));
  const distinctApproverIds = uniq(allApproverIds);
  if (distinctApproverIds.length === 0) {
    return [];
  }

  return await getUsersRaw({ by: { userIds: distinctApproverIds } });
};

const getOrganisations = async (userId) => {
  const orgMapping = userId.startsWith("inv-")
    ? await getInvitationOrganisationsRaw({ invitationId: userId.substr(4) })
    : await getUserOrganisationsWithServicesRaw({ userId });
  if (!orgMapping) {
    return [];
  }
  const allApprovers = await getApproverDetails(orgMapping);
  // Filter out all deactivated accounts
  const activeAccountApprovers = allApprovers.filter(
    (approver) => approver.status !== 0,
  );

  const organisations = await Promise.all(
    orgMapping.map(async (invitation) => {
      const approvers = invitation.approvers
        .map((approverId) => {
          return activeAccountApprovers.find(
            (x) => x.sub.toLowerCase() === approverId.toLowerCase(),
          );
        })
        .filter((x) => x);
      return {
        id: invitation.organisation.id,
        name: invitation.organisation.name,
        LegalName: invitation.organisation.LegalName,
        role: invitation.role,
        urn: invitation.organisation.urn,
        uid: invitation.organisation.uid,
        upin: invitation.organisation.upin,
        ukprn: invitation.organisation.ukprn,
        status: invitation.organisation.status,
        numericIdentifier: invitation.numericIdentifier,
        textIdentifier: invitation.textIdentifier,
        approvers,
      };
    }),
  );

  return organisations;
};

const getPendingRequests = async (userId) => {
  const pendingUserRequests = (await getPendingRequestsRaw({ userId })) || [];
  return pendingUserRequests.map((request) => ({
    id: request.org_id,
    name: request.org_name,
    urn: request.urn,
    ukprn: request.ukprn,
    uid: request.uid,
    upin: request.upin,
    status: request.org_status,
    requestDate: request.created_date,
    requestId: request.id,
  }));
};

const action = async (req, res) => {
  const user = await getUserDetailsById(req.params.uid, req);
  const showChangeEmail = !isInternalEntraUser(user);
  user.formattedLastLogin = user.lastLogin
    ? dateFormat(user.lastLogin, "longDateFormat")
    : "";
  if (user.status.id === 0) {
    const userStatus = await getUserStatusRaw({ userId: user.id });
    user.statusChangeReasons = userStatus ? userStatus.statusChangeReasons : [];
  }
  const organisationDetails = await getOrganisations(user.id);
  const organisationRequests = !user.id.startsWith("inv-")
    ? await getPendingRequests(user.id)
    : [];
  const formattedOrganisationRequests = organisationRequests.map(
    (organisation) => ({
      ...organisation,
      formattedRequestDate: organisation.requestDate
        ? dateFormat(organisation.requestDate, "shortDateFormat")
        : "",
    }),
  );
  const allOrgs = organisationDetails.concat(formattedOrganisationRequests);
  const sortedOrgs = sortBy(allOrgs, "name");
  req.session.user = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
  req.session.type = "organisations";
  req.session.params = {
    ...req.session.params,
    ...req.query,
  };

  // Check if it's possible to re-populate search with the current params.
  if (
    req.session.params.showFilters === "true" ||
    (typeof req.session.params.criteria !== "undefined" &&
      req.session.params.criteria !== "")
  ) {
    req.session.params.redirectedFromSearchResult = true;
  } else {
    req.session.params.redirectedFromSearchResult = false;
  }

  // If searchType isn't set or equal to organisations, set it to users.
  // This allows us to avoid populating user search after going from the org user list straight to a user profile.
  if (req.session.params.searchType !== "organisations") {
    req.session.params.searchType = "users";
  }

  logger.audit(`${req.user.email} viewed user ${user.email}`, {
    type: "organisations",
    subType: "user-view",
    userId: req.user.sub,
    userEmail: req.user.email,
    viewedUser: user.id,
  });

  sendResult(req, res, "users/views/organisations", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    backLink:
      req.session?.params?.searchType === "organisations"
        ? "/organisations"
        : "/users",
    user,
    showChangeEmail,
    organisations: sortedOrgs,
    isInvitation: req.params.uid.startsWith("inv-"),
  });
};

module.exports = action;
