const users = [
  {
    id: 'fef763fe-0413-4ffc-a6e2-4dc0cc168991',
    name: 'Wade Wilson',
    email: 'deadpool@x-force.test',
    organisation: {
      name: 'X-Force'
    },
    lastLogin: new Date(2018, 0, 11, 11, 30, 57),
    status: {
      description: 'Active'
    }
  },
  {
    id: '89de4e03-7114-4761-8de3-b38112932343',
    name: 'Frank Castle',
    email: 'punisher@forcerecon.test',
    organisation: {
      name: 'Force Recon'
    },
    lastLogin: new Date(2018, 0, 11, 12, 15, 0),
    status: {
      description: 'Active'
    }
  },
];

const search = async (criteria, pageNumber) => {
  const results = users.filter(u => u.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.email.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.organisation.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1);
  return Promise.resolve({
    users: results.sort((x, y) => {
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

const getById = async (userId) => {
  return users.find(x => x.id === userId);
};

const getExistingIndex = async () => {
  return Promise.resolve('existing');
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

const getDateOfLastIndexUpdate = async () => {
  return Promise.resolve(undefined);
};

const setDateOfLastIndexUpdate = async (date) => {
  return Promise.resolve();
};

module.exports = {
  search,
  getById,
  getExistingIndex,
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
  getDateOfLastIndexUpdate,
  setDateOfLastIndexUpdate,
};
