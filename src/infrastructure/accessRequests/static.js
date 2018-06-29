const accessRequests = [
  {
    userId: 'user1',
    name: 'Wade Wilson',
    email: 'deadpool@x-force.test',
    organisation: {
      id: 'org1',
      name: 'X-Force'
    },
    createdDate: new Date(2018, 0, 11, 11, 30, 57),
  },
  {
    userId: 'user2',
    name: 'Frank Castle',
    email: 'punisher@forcerecon.test',
    organisation: {
      id: 'org2',
      name: 'Force Recon'
    },
    createdDate: new Date(2018, 0, 11, 12, 15, 0),
  },
];

const search = async (criteria, pageNumber) => {
  const results = accessRequests.filter(u => u.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.email.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.organisation.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1);
  return Promise.resolve({
    accessRequests: results.sort((x, y) => {
      if (x < y) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
      return 0;
    }),
    numberOfPages: 1,
  });
};

const createIndex = async () => {
  return Promise.resolve('new');
};

const updateIndex = async (users, index) => {
  return Promise.resolve(null);
};

const updateActiveIndex = async (index) => {
  return Promise.resolve(null);
};

const deleteUnusedIndexes = async () => {
  return Promise.resolve(null);
};

const deleteAccessRequest = async () => {
  return Promise.resolve(null);
};

const getById = async (userId, filterParam='id') => {
  return Promise.resolve(null);
};

module.exports = {
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
  search,
  getById,
  deleteAccessRequest,
};
