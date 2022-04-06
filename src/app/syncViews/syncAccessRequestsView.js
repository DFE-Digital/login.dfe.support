const accessRequests = require('./../../infrastructure/accessRequests');
const logger = require('./../../infrastructure/logger');
const directories = require('./../../infrastructure/directories');
const organisations = require('./../../infrastructure/organisations');
const {v4:uuid} = require('uuid');
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');

const getUserDetails = async (usersForApproval, correlationId) => {
  const allUserId = flatten(usersForApproval.usersForApproval.map((user) => user.user_id));
  const distinctUserIds = uniq(allUserId);
  return await directories.getUsersById(distinctUserIds, correlationId);
};

const loadAccessRequests = async (newIndexName, correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  while (hasMorePages) {
    logger.info(`Syncing page ${pageNumber} of accessRequests`);
    const pageOfAccessRequests = await organisations.getOrganisationUsersForApproval(pageNumber, correlationId);
    if (pageOfAccessRequests.usersForApproval && pageOfAccessRequests.usersForApproval.length > 0) {
      const users = await getUserDetails(pageOfAccessRequests, correlationId);
      const mappedAccessRequests =  pageOfAccessRequests.usersForApproval.map((accessRequest) => {
        const userFound = users.find(c => c.sub.toLowerCase() === accessRequest.user_id.toLowerCase());
        return {
          userId: accessRequest.user_id,
          name: userFound ? `${userFound.given_name} ${userFound.family_name}` : 'No Name Supplied',
          email: userFound ? userFound.email : '',
          organisation:  {
            id: accessRequest.org_id,
            name: accessRequest.org_name,
            address: accessRequest.org_address,
            category: accessRequest.category ? accessRequest.category.id : '',
            urn: accessRequest.urn,
            uid: accessRequest.uid,
          },
          createdDate: accessRequest.created_date,
        };
      });
      await accessRequests.updateIndex(mappedAccessRequests, newIndexName);
    }
    pageNumber++;
    hasMorePages = pageNumber <= pageOfAccessRequests.totalNumberOfPages;
  }
};




const syncAccessRequests = async () => {
  const correlationId = uuid();

  logger.info(`Starting to sync access request view (correlation id: ${correlationId})`);

  // Create new index
  const newIndexName = await accessRequests.createIndex();

  // Create all AccessRequests
  await loadAccessRequests(newIndexName, correlationId);

  // Re-point current index
  await accessRequests.updateActiveIndex(newIndexName);
  logger.info(`Pointed access requests index to ${newIndexName}`);

  logger.info('Finished syncing access request view');
};

module.exports = syncAccessRequests;