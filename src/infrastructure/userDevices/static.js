const userDevices = [
  {
    name: 'Wade Wilson',
    email: 'deadpool@x-force.test',
    organisation: {
      name: 'X-Force'
    },
    lastLogin: new Date(2018, 0, 11, 11, 30, 57),
    device: {
      id: 'b104375f-04d9-4bc3-a996-4d3c01fc9d52',
      serialNumber: '123-678-543',
      status: 'Active',
    }
  },
  {
    name: 'Frank Castle',
    email: 'punisher@forcerecon.test',
    organisation: {
      name: 'Force Recon'
    },
    lastLogin: new Date(2018, 0, 11, 12, 15, 0),
    device: {
      id: '76c8a631-3e4b-4df9-a64e-77dbaeb775c4',
      serialNumber: '234-654-678',
      status: 'Active',
    }
  },
];

const search = async (criteria, pageNumber) => {
  const results = userDevices.filter(u => u.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.email.toLowerCase().indexOf(criteria.toLowerCase()) > -1
    || u.organisation.name.toLowerCase().indexOf(criteria.toLowerCase()) > -1);
  return Promise.resolve({
    userDevices: results.sort((x, y) => {
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

const getByUserId = async (userId, filterParam='id') => {
  return Promise.resolve(null);
};

module.exports = {
  search,
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
  getByUserId,
};
