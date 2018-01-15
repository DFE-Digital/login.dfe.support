const users = [
  {
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

const search = async (criteria) => {
  const results = users.filter(u => u.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.email.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.organisation.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1);
  return Promise.resolve(results.sort((x, y) => {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  }));
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

module.exports = {
  search,
  createIndex,
  updateIndex,
  updateActiveIndex,
};
