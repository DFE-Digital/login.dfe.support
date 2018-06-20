jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/accessRequests');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/audit/cache');
jest.mock('./../../../src/infrastructure/audit');
jest.mock('uuid/v4');

const accessRequests = require('./../../../src/infrastructure/accessRequests');
const directories = require('./../../../src/infrastructure/directories');
const organisations = require('./../../../src/infrastructure/organisations');
const uuid = require('uuid/v4');
const syncAccessRequests = require('./../../../src/app/syncViews/syncAccessRequestsView');

const user1 = {
  sub: 'user1',
  given_name: 'User',
  family_name: 'One',
  email: 'user.one@unit.test',
  password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
  salt: 'PasswordIs-password-',
};
const user2 = {
  sub: 'user2',
  given_name: 'User',
  family_name: 'Two',
  email: 'user.two@unit.test',
  password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
  salt: 'PasswordIs-password-',
};

describe('When syncing access request materialised view', function () {
  beforeEach(() => {
    accessRequests.createIndex.mockReset();
    accessRequests.createIndex.mockReturnValue('test-index');

    accessRequests.updateIndex.mockReset();

    directories.getUsersById.mockReset();
    directories.getUsersById.mockReturnValue(
        [
          { sub: 'user1', given_name: 'User', family_name:'One', email: 'user.one@unit.tests' },
          { sub: 'user6', given_name: 'User', family_name:'Six', email: 'user.six@unit.tests' },
          { sub: 'user11', given_name: 'User', family_name: 'Eleven', email: 'user.eleven@unit.tests' },
        ]
    );

    organisations.getOrganisationUsersForApproval.mockReset().mockReturnValue({
      usersForApproval:[
      {
        org_id: '60EEAA8D-D21D-44E9-BF10-6220E841FDAB',
        org_name: 'Oxley Park Academy',
        user_id: 'user1',
        created_date: '2018-05-31T11:00:05.861Z',
        org_address: 'my address',
        category: {
          id: '001',
          name: 'Establishment'
        },
        urn: null,
        uid: '222222',
        ukprn: '11111'
      },
      {
        org_id: '60EEAA8D-D21D-44E9-BF10-6220E841FDAB',
        org_name: 'Oxley Park Academy',
        user_id: 'user2',
        created_date: '2018-05-31T11:00:05.861Z',
        org_address: 'my address',
        category: {
          id: '001',
          name: 'Establishment'
        },
        urn: null,
        uid: '222222',
        ukprn: '11111'
      },
    ],totalNumberOfPages: 1});

    uuid.mockImplementation(() => {
      return 'new-uuid';
    });
  });

  it('then it should create a new index', async () => {
    await syncAccessRequests();

    expect(accessRequests.createIndex.mock.calls).toHaveLength(1);
  });

  it('then it will keep getting pages of accessRequests from organisations until it reaches the end', async () => {
    organisations.getOrganisationUsersForApproval.mockReset();
    organisations.getOrganisationUsersForApproval.mockImplementation(() => {
      return {
        usersForApproval: [],
        totalNumberOfPages: 2,
      };
    });

    await syncAccessRequests();

    expect(organisations.getOrganisationUsersForApproval.mock.calls).toHaveLength(2);
    expect(organisations.getOrganisationUsersForApproval.mock.calls[0][0]).toBe(1);
    expect(organisations.getOrganisationUsersForApproval.mock.calls[1][0]).toBe(2);
  });

  it('then it should get a list of users by ids from the directories api', async () => {
    await syncAccessRequests();

    expect(directories.getUsersById.mock.calls).toHaveLength(1);
    expect(directories.getUsersById.mock.calls[0][0]).toEqual(['user1','user2']);
  });

  it('then it should get the organisation for the access request', async () => {

  });

  it('then it should update the new index with users', async () => {
    await syncAccessRequests();

    expect(accessRequests.updateIndex.mock.calls).toHaveLength(1);
    expect(accessRequests.updateIndex.mock.calls[0][0]).toHaveLength(2);
    expect(accessRequests.updateIndex.mock.calls[0][0][0]).toEqual({
     createdDate: '2018-05-31T11:00:05.861Z',
      userId: 'user1',
     email: 'user.one@unit.tests',
     name: 'User One',
      organisation: {
       id: '60EEAA8D-D21D-44E9-BF10-6220E841FDAB',
        name: 'Oxley Park Academy',
        address: 'my address',
        category: '001',
        uid: '222222',
        urn: null,
      }
    });
    expect(accessRequests.updateIndex.mock.calls[0][0][1]).toEqual({
      createdDate: '2018-05-31T11:00:05.861Z',
      userId: 'user2',
      email: '',
      name: 'No Name Supplied',
      organisation: {
        id: '60EEAA8D-D21D-44E9-BF10-6220E841FDAB',
        name: 'Oxley Park Academy',
        address: 'my address',
        category: '001',
        uid: '222222',
        urn: null,
      }
    });
    expect(accessRequests.updateIndex.mock.calls[0][1]).toBe('test-index');
  });

  it('then it should update config to point at new index', async () => {
    await syncAccessRequests();

    expect(accessRequests.updateActiveIndex.mock.calls).toHaveLength(1);
    expect(accessRequests.updateActiveIndex.mock.calls[0][0]).toBe('test-index');
  });

  it('then it should pass correlationId to directories and organisations', async () => {
    await syncAccessRequests();

    expect(directories.getUsersById.mock.calls[0][1]).toBe('new-uuid');
    expect(organisations.getOrganisationUsersForApproval.mock.calls[0][1]).toBe('new-uuid');
  });

});