jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/users');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/audit');
jest.mock('uuid/v4');
jest.mock('ioredis');

const users = require('./../../../src/infrastructure/users');
const directories = require('./../../../src/infrastructure/directories');
const organisations = require('./../../../src/infrastructure/organisations');
const access = require('./../../../src/infrastructure/access');
const audit = require('./../../../src/infrastructure/audit');
const uuid = require('uuid/v4');
const { syncDiffUsersView } = require('./../../../src/app/syncViews');

const testData = {
  correlationId: 'DiffUserIndex-some-uuid',
  indexName: 'existing-user-index-name',
  indexLastUpdated: new Date(Date.UTC(2018, 8, 7, 11, 35, 45)),
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
        legacyUsernames: [
          'sa_user1',
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
      invitations: [{
        id: 'invitation1',
        firstName: 'Invited',
        lastName: 'User1',
        email: 'invited.user1@unit.tests',
      }],
      numberOfPages: 2,
    },
    page2: {
      invitations: [{
        id: 'invitation2',
        firstName: 'Invited',
        lastName: 'User2',
        email: 'invited.user2@unit.tests',
        deactivated: true,
      }],
      numberOfPages: 2,
    },
  },
  userServices: {
    user1: [{
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
    user2: [{
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
  },
  invitationServices: {
    invitation1: [{
      invitationId: 'invitation1',
      organisation: {
        id: 'org1',
        name: 'Organisation One',
        category: {
          id: '001'
        },
      },
      services:[
        {
          id: 'svc1',
          name: 'Service 1',
        },
      ],
    }],
    invitation2: [{
      invitationId: 'invitation2',
      organisation: {
        id: 'org2',
        name: 'Organisation Two',
        category: {
          id: '002'
        },
      },
      services:[
        {
          id: 'svc1',
          name: 'Service 1',
        },
      ],
    }],
  },
  audit: {
    stats: {
      user1: {
        lastLogin: new Date(2018, 7, 6),
        lastStatusChange: undefined,
        loginsInPast12Months: [{ timestamp: new Date(2018, 7, 4) }, { timestamp: new Date(2018, 7, 5) }, { timestamp: new Date(2018, 7, 6) }]
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

describe('When syncing diff users materialised view', () => {
  beforeEach(() => {
    users.getExistingIndex.mockReset().mockReturnValue(testData.indexName);
    users.updateIndex.mockReset();
    users.getDateOfLastIndexUpdate.mockReset().mockReturnValue(testData.indexLastUpdated);
    users.setDateOfLastIndexUpdate.mockReset();

    directories.getPageOfUsers.mockReset().mockImplementation((pageNumber) => {
      return _getPageOfData(testData.users, pageNumber);
    });
    directories.getPageOfInvitations.mockReset().mockImplementation((pageNumber) => {
      return _getPageOfData(testData.invitations, pageNumber);
    });

    organisations.getServicesByUserId.mockReset().mockImplementation((userId) => {
      if (Object.keys(testData.userServices).find(x => x === userId)) {
        return testData.userServices[userId];
      }
      return undefined;
    });
    organisations.getInvitationOrganisations.mockReset().mockImplementation((invitationId) => {
      if (Object.keys(testData.invitationServices).find(x => x === invitationId)) {
        return testData.invitationServices[invitationId];
      }
      return undefined;
    });

    audit.cache.getStatsForUser.mockReset().mockImplementation((userId) => {
      if (Object.keys(testData.audit.stats).find(x => x === userId)) {
        return testData.audit.stats[userId];
      }
      return undefined;
    });

    uuid.mockReset().mockReturnValue('some-uuid');
  });

  it('then it should get existing user index', async () => {
    await syncDiffUsersView();

    expect(users.getExistingIndex).toHaveBeenCalledTimes(1);
  });

  it('then it should get all pages of users that have changed since the last iteration', async () => {
    await syncDiffUsersView();

    expect(directories.getPageOfUsers).toHaveBeenCalledTimes(2);
    expect(directories.getPageOfUsers).toHaveBeenCalledWith(1, 250, false, true, true, testData.indexLastUpdated, testData.correlationId);
    expect(directories.getPageOfUsers).toHaveBeenCalledWith(2, 250, false, true, true, testData.indexLastUpdated, testData.correlationId);
  });

  it('then it should get all pages of users if no index has occurred', async () => {
    users.getDateOfLastIndexUpdate.mockReturnValue(undefined);

    await syncDiffUsersView();

    expect(directories.getPageOfUsers).toHaveBeenCalledTimes(2);
    expect(directories.getPageOfUsers).toHaveBeenCalledWith(1, 250, false, true, true, undefined, testData.correlationId);
    expect(directories.getPageOfUsers).toHaveBeenCalledWith(2, 250, false, true, true, undefined, testData.correlationId);
  });

  it('then it should get all pages of user services', async () => {
    await syncDiffUsersView();

    expect(organisations.getServicesByUserId).toHaveBeenCalledTimes(2);
    expect(organisations.getServicesByUserId).toHaveBeenCalledWith(testData.users.page1.users[0].sub, testData.correlationId);
    expect(organisations.getServicesByUserId).toHaveBeenCalledWith(testData.users.page1.users[0].sub, testData.correlationId);
  });

  it('then it should update index with user1', async () => {
    await syncDiffUsersView();

    const expectedUser = testData.users.page1.users[0];
    const expectedServices = testData.userServices.user1;
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
    expect(actual.legacyUsernames).toEqual(expectedUser.legacyUsernames);
  });

  it('then it should update index with user2', async () => {
    await syncDiffUsersView();

    const expectedUser = testData.users.page2.users[0];
    const expectedServices = testData.userServices.user2;
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
    expect(actual.legacyUsernames).toEqual([]);
  });

  it('then it should get all pages of invitations that have changed since the last iteration', async () => {
    await syncDiffUsersView();

    expect(directories.getPageOfInvitations).toHaveBeenCalledTimes(2);
    expect(directories.getPageOfInvitations).toHaveBeenCalledWith(1, 250, testData.indexLastUpdated, testData.correlationId);
    expect(directories.getPageOfInvitations).toHaveBeenCalledWith(2, 250, testData.indexLastUpdated, testData.correlationId);
  });

  it('then it should get all pages of invitations if no index has occurred', async () => {
    users.getDateOfLastIndexUpdate.mockReturnValue(undefined);

    await syncDiffUsersView();

    expect(directories.getPageOfInvitations).toHaveBeenCalledTimes(2);
    expect(directories.getPageOfInvitations).toHaveBeenCalledWith(1, 250, undefined, testData.correlationId);
    expect(directories.getPageOfInvitations).toHaveBeenCalledWith(2, 250, undefined, testData.correlationId);
  });

  it('then it should update index with invitation1', async () => {
    await syncDiffUsersView();

    const expectedInvitation = testData.invitations.page1.invitations[0];
    const expectedServices = testData.invitationServices.invitation1;
    const actual = users.updateIndex.mock.calls[1][0].find(x => x.id === `inv-${expectedInvitation.id}`);
    expect(actual).toBeDefined();
    expect(actual.name).toEqual(`${expectedInvitation.firstName} ${expectedInvitation.lastName}`);
    expect(actual.firstName).toEqual(expectedInvitation.firstName);
    expect(actual.lastName).toEqual(expectedInvitation.lastName);
    expect(actual.email).toEqual(expectedInvitation.email);
    expect(actual.organisation).toEqual({
      id: expectedServices[0].organisation.id,
      name: expectedServices[0].organisation.name,
    });
    expect(actual.organisationCategories).toEqual([expectedServices[0].organisation.category.id]);
    expect(actual.services).toEqual([expectedServices[0].services[0].id]);
    expect(actual.status).toEqual({
      id: -1,
      description: 'Invited',
      changedOn: null,
    });
  });

  it('then it should update index with invitation2', async () => {
    await syncDiffUsersView();

    const expectedInvitation = testData.invitations.page2.invitations[0];
    const expectedServices = testData.invitationServices.invitation2;
    const actual = users.updateIndex.mock.calls[1][0].find(x => x.id === `inv-${expectedInvitation.id}`);
    expect(actual).toBeDefined();
    expect(actual.name).toEqual(`${expectedInvitation.firstName} ${expectedInvitation.lastName}`);
    expect(actual.firstName).toEqual(expectedInvitation.firstName);
    expect(actual.lastName).toEqual(expectedInvitation.lastName);
    expect(actual.email).toEqual(expectedInvitation.email);
    expect(actual.organisation).toEqual({
      id: expectedServices[0].organisation.id,
      name: expectedServices[0].organisation.name,
    });
    expect(actual.organisationCategories).toEqual([expectedServices[0].organisation.category.id]);
    expect(actual.services).toEqual([expectedServices[0].services[0].id]);
    expect(actual.status).toEqual({
      id: -2,
      description: 'Deactivated Invitation',
      changedOn: null,
    });
  });

  it('then it should update time of last update', async () => {
    await syncDiffUsersView();

    expect(users.setDateOfLastIndexUpdate).toHaveBeenCalledTimes(1);
  });
});
