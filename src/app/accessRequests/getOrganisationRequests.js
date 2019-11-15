const { getAllRequestsForSupport } = require('./../../infrastructure/organisations');
const Account = require('./../../infrastructure/directories');
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const sortBy = require('lodash/sortBy');

const getUserDetails = async (usersForApproval) => {
  const allUserId = flatten(usersForApproval.map((user) => user.user_id));
  if (allUserId.length === 0) {
    return [];
  }
  const distinctUserIds = uniq(allUserId);
  return await Account.getUsersByIdV2(distinctUserIds);
};

const mapStatusForSupport = (status) => {
  switch (status.id) {
    case 0:
      return "Awaiting approver action";
    case 2:
      return `${status.name} - Escalated to support`;
    case 3:
      return `${status.name} - Escalated to support`;
    default:
      return status.name;
  }
};

const getOrganisationRequests = async (req, res) => {
  let requests = [];

  try {
    requests = await getAllRequestsForSupport(req.id);

    if (requests) {
      const userList = await getUserDetails(requests) || [];

      requests = requests.map((user) => {
        const userFound = userList.find(c => c.sub.toLowerCase() === user.user_id.toLowerCase());
        const usersEmail = userFound ? userFound.email : '';
        const usersName = userFound ? `${userFound.given_name} ${userFound.family_name}` : 'No Name Supplied';
        const statusText = mapStatusForSupport(user.status);
        return Object.assign({usersEmail}, {usersName}, {statusText}, user);
      });

      requests = sortBy(requests, ['created_date']);
    }
  } catch (e) {
    throw new Error(`Failed to obtain Organisation requests requiring support: (correlationId: ${req.id}, error: ${e.message}`);
  }

  return res.render('accessRequests/views/organisationRequests', {
    csrfToken: req.csrfToken(),
    title: 'Requests - DfE Sign-in',
    requests,
  });
};

module.exports = getOrganisationRequests;
