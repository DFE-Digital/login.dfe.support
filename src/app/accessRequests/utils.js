const accessRequests = require('../../infrastructure/accessRequests');

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;

  let criteria = paramsSource.criteria;
  if (!criteria) {
    criteria = '';
  }

  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  let sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'name';
  let sortAsc = (paramsSource.sortdir ? paramsSource.sortdir : 'asc').toLowerCase() === 'asc';

  const results = await accessRequests.search(criteria + '*', page, sortBy, sortAsc);
  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for access requests in support using criteria "${criteria}"`, {
    type: 'support',
    subType: 'accessRequest-search',
    userId: req.user.sub,
    userEmail: req.user.email,
    criteria: criteria,
    pageNumber: page,
    numberOfPages: results.numberOfPages,
    sortedBy: sortBy,
    sortDirection: sortAsc ? 'asc' : 'desc',
  });

  return {
    criteria,
    page,
    sortBy,
    sortOrder: sortAsc ? 'asc' : 'desc',
    numberOfPages: results.totalNumberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    accessRequests: results.accessRequests,
    sort: {
      organisation: {
        nextDirection: sortBy === 'organisation' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'organisation',
      },
      email: {
        nextDirection: sortBy === 'email' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'email',
      },
      name: {
        nextDirection: sortBy === 'name' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'name',
      },
      createdDate: {
        nextDirection: sortBy === 'createddate' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'createddate',
      },
    }
  };
};

module.exports = {
  search,
};