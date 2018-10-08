jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/users');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/audit');
jest.mock('uuid/v4');
jest.mock('ioredis');

const users = require('./../../../src/infrastructure/users');
const directories = require('./../../../src/infrastructure/directories');
const organisations = require('./../../../src/infrastructure/organisations');
const audit = require('./../../../src/infrastructure/audit');
const uuid = require('uuid/v4');
const { syncFullUsersView } = require('./../../../src/app/syncViews');

const testData = {
  correlationId: 'FullUserIndex-some-uuid',
  indexName: 'new-user-index-name',
  users: {
    page1: {
      users: [{
        sub: 'user1',
        given_name: 'User',
        family_name: 'One',
        email: 'user.one@unit.tests',
        status: 1,
        codes: [
          { code: 'ABC123', type: 'changeemail', email: 'user.oneplus@unit.tests' },
        ],
      }],
      numberOfPages: 2,
    },
    page2: {
      users: [{
        sub: 'user2',
        given_name: 'User',
        family_name: 'Two',
        email: 'user.two@unit.tests',
        status: 0,
        codes: [],
      }],
      numberOfPages: 2,
    },
  },
  invitations: {
    page1: {
      invitations: [],
      numberOfPages: 0,
    },
  },
  userServices: {
    page1: {
      services: [{
        id: 'svc1',
        userId: 'user1',
        requestDate: new Date(2018, 6, 1),
        organisation: {
          id: 'org1',
          name: 'Organisation One',
          category: {
            id: '001'
          },
        },
      }],
      totalNumberOfPages: 2,
    },
    page2: {
      services: [{
        id: 'svc1',
        userId: 'user2',
        requestDate: new Date(2018, 6, 3),
        organisation: {
          id: 'org2',
          name: 'Organisation Two',
          category: {
            id: '002'
          },
        },
      }],
      totalNumberOfPages: 2,
    },
  },
  invitationServices: {
    page1: {
      service: [],
      totalNumberOfPages: 0,
    },
  },
  audit: {
    stats: {
      user1: {
        lastLogin: new Date(2018, 7, 6),
        lastStatusChange: undefined,
        loginsInPast12Months: [{timestamp:new Date(2018, 7, 4)},{timestamp:new Date(2018, 7, 5)},{timestamp:new Date(2018, 7, 6)}]
      },
    },
  },
};

const _getPageOfData = (source, pageNumber) => {
  const key = `page${pageNumber}`;
  if (Object.keys(source).find(x => x === key)) {
    return source[key];
  }
  return undefined;
};

describe('When syncing full users materialised view', () => {
  beforeEach(() => {
    users.createIndex.mockReset().mockReturnValue(testData.indexName);
    users.updateIndex.mockReset();
    users.updateActiveIndex.mockReset();

    directories.getPageOfUsers.mockReset().mockImplementation((pageNumber) => {
      return _getPageOfData(testData.users, pageNumber);
    });
    directories.getPageOfInvitations.mockReset().mockReturnValue(testData.invitations.page1);

    organisations.listUserServices.mockReset().mockImplementation((pageNumber) => {
      return _getPageOfData(testData.userServices, pageNumber);
    });
    organisations.listInvitationServices.mockReset().mockReturnValue(testData.invitationServices.page1);

    audit.cache.getStatsForUser.mockReset().mockImplementation((userId) => {
      if (Object.keys(testData.audit.stats).find(x => x === userId)) {
        return testData.audit.stats[userId];
      }
      return undefined;
    });

    uuid.mockReset().mockReturnValue('some-uuid');
  });

  it('then it should create a new user index', async () => {
    await syncFullUsersView();

    expect(users.createIndex).toHaveBeenCalledTimes(1);
  });

  it('then it should get all pages of users', async () => {
    await syncFullUsersView();

    expect(directories.getPageOfUsers).toHaveBeenCalledTimes(2);
    expect(directories.getPageOfUsers).toHaveBeenCalledWith(1, 250, false, true, undefined, testData.correlationId);
    expect(directories.getPageOfUsers).toHaveBeenCalledWith(2, 250, false, true, undefined, testData.correlationId);
  });

  it('then it should get all pages of user services', async () => {
    await syncFullUsersView();

    expect(organisations.listUserServices).toHaveBeenCalledTimes(2);
    expect(organisations.listUserServices).toHaveBeenCalledWith(1, 250, testData.correlationId);
    expect(organisations.listUserServices).toHaveBeenCalledWith(2, 250, testData.correlationId);
  });

  it('then it should update index with user1', async () => {
    await syncFullUsersView();

    const expectedUser = testData.users.page1.users[0];
    const expectedServices = testData.userServices.page1.services;
    const actual = users.updateIndex.mock.calls[0][0].find(x => x.id === expectedUser.sub);
    expect(actual).toBeDefined();
    expect(actual.name).toEqual(`${expectedUser.given_name} ${expectedUser.family_name}`);
    expect(actual.firstName).toEqual(expectedUser.given_name);
    expect(actual.lastName).toEqual(expectedUser.family_name);
    expect(actual.email).toEqual(expectedUser.email);
    expect(actual.organisation).toEqual({
      id: expectedServices[0].organisation.id,
      name: expectedServices[0].organisation.name,
    });
    expect(actual.organisationCategories).toEqual([expectedServices[0].organisation.category.id]);
    expect(actual.services).toEqual([expectedServices[0].id]);
    expect(actual.lastLogin).toEqual(testData.audit.stats.user1.lastLogin.getTime());
    expect(actual.successfulLoginsInPast12Months).toEqual(testData.audit.stats.user1.loginsInPast12Months.length);
    expect(actual.status).toEqual({
      id: 1,
      description: 'Active',
      changedOn: null,
    });
  });

  it('then it should update index with user2', async () => {
    await syncFullUsersView();

    const expectedUser = testData.users.page2.users[0];
    const expectedServices = testData.userServices.page2.services;
    const actual = users.updateIndex.mock.calls[0][0].find(x => x.id === expectedUser.sub);
    expect(actual).toBeDefined();
    expect(actual.name).toEqual(`${expectedUser.given_name} ${expectedUser.family_name}`);
    expect(actual.firstName).toEqual(expectedUser.given_name);
    expect(actual.lastName).toEqual(expectedUser.family_name);
    expect(actual.email).toEqual(expectedUser.email);
    expect(actual.organisation).toEqual({
      id: expectedServices[0].organisation.id,
      name: expectedServices[0].organisation.name,
    });
    expect(actual.organisationCategories).toEqual([expectedServices[0].organisation.category.id]);
    expect(actual.services).toEqual([expectedServices[0].id]);
    expect(actual.lastLogin).toBeNull();
    expect(actual.successfulLoginsInPast12Months).toEqual(0);
    expect(actual.status).toEqual({
      id: 0,
      description: 'Deactivated',
      changedOn: null,
    });
  });

  it('then it should update active index to be one created and populated in sync', async () => {
    await syncFullUsersView();

    expect(users.updateActiveIndex).toHaveBeenCalledTimes(1);
    expect(users.updateActiveIndex).toHaveBeenCalledWith(testData.indexName);
  });
});
