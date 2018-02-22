jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/users');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/audit');
jest.mock('uuid/v4');

const users = require('./../../../src/infrastructure/users');
const directories = require('./../../../src/infrastructure/directories');
const organisations = require('./../../../src/infrastructure/organisations');
const audit = require('./../../../src/infrastructure/audit');
const uuid = require('uuid/v4');
const syncUsersView = require('./../../../src/app/syncViews/syncUsersView');

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

describe('When syncing users materialised view', function () {
  beforeEach(() => {
    users.createIndex.mockReset();
    users.createIndex.mockReturnValue('test-index');

    users.updateIndex.mockReset();

    directories.getPageOfUsers.mockReset();
    directories.getPageOfUsers.mockReturnValue({
      users: [user1, user2],
      numberOfPages: 1,
    });

    directories.getPageOfInvitations.mockReset();
    directories.getPageOfInvitations.mockReturnValue({
      invitations: [],
      numberOfPages: 1,
      page: 1,
    });

    organisations.getUserOrganisations.mockReset();
    organisations.getUserOrganisations.mockReturnValue([{
      userService: {
        id: 'userservice1',
        userId: 'user1',
        status: 0
      },
      organisation: {
        id: 'org1',
        name: 'Test Org'
      },
      service: {
        id: 'service1',
        name: 'Test Service'
      }
    }]);

    audit.getUserAudit.mockReset();
    audit.getUserAudit.mockReturnValue({
      audits: [{
        type: 'sign-in',
        subType: 'username-password',
        success: true,
        userId: 'user1',
        userEmail: 'user.one@unit.test',
        level: 'audit',
        message: 'Successful login attempt for user.one@unit.test (id: user1)',
        timestamp: '2017-10-24T12:35:51.633Z',
      }],
      numberOfPages: 1,
    });

    uuid.mockImplementation(() => {
      return 'new-uuid';
    });
  });

  it('then it should create a new index', async () => {
    await syncUsersView();

    expect(users.createIndex.mock.calls).toHaveLength(1);
  });

  it('then it should keep getting pages of users from directories until it reaches the end', async () => {
    directories.getPageOfUsers.mockReset();
    directories.getPageOfUsers.mockImplementation(() => {
      return {
        users: [],
        numberOfPages: 2,
      };
    });

    await syncUsersView();

    expect(directories.getPageOfUsers.mock.calls).toHaveLength(2);
    expect(directories.getPageOfUsers.mock.calls[0][0]).toBe(1);
    expect(directories.getPageOfUsers.mock.calls[1][0]).toBe(2);
  });

  it('then it should get organisations for each user', async () => {
    await syncUsersView();

    expect(organisations.getUserOrganisations.mock.calls).toHaveLength(2);
    expect(organisations.getUserOrganisations.mock.calls[0][0]).toBe(user1.sub);
    expect(organisations.getUserOrganisations.mock.calls[1][0]).toBe(user2.sub);
  });

  it('then it should get audits for user until a successful login is found', async () => {
    directories.getPageOfUsers.mockReset();
    directories.getPageOfUsers.mockReturnValue({
      users: [user1],
      numberOfPages: 1,
    });

    audit.getUserAudit.mockReset();
    audit.getUserAudit.mockImplementation((userId, pageNumber) => {
      if (pageNumber === 1) {
        return {
          audits: [{
            'type': 'change-password',
            'success': true,
            'userId': 'user1',
            'level': 'audit',
            'message': 'Successfully changed password for user.one@unit.test (id: user1)',
            'timestamp': '2017-11-02T07:30:18.987Z'
          }],
          numberOfPages: 3,
        };
      }
      if (pageNumber === 2) {
        return {
          audits: [{
            type: 'sign-in',
            subType: 'username-password',
            success: true,
            userId: 'user1',
            userEmail: 'user.one@unit.test',
            level: 'audit',
            message: 'Successful login attempt for user.one@unit.test (id: user1)',
            timestamp: '2017-10-24T12:35:51.633Z'
          }],
          numberOfPages: 3,
        };
      }
      return {
        audits: [{
          'type': 'change-password',
          'success': true,
          'userId': 'user1',
          'level': 'audit',
          'message': 'Successfully changed password for user.one@unit.test (id: user1)',
          'timestamp': '2017-11-02T07:30:18.987Z'
        }],
        numberOfPages: 3,
      };
    });

    await syncUsersView();

    expect(audit.getUserAudit.mock.calls).toHaveLength(2);
    expect(audit.getUserAudit.mock.calls[0][1]).toBe(1);
    expect(audit.getUserAudit.mock.calls[1][1]).toBe(2);
  });

  it('then it should get audits for user until no more pages are available if not successful login found', async () => {
    directories.getPageOfUsers.mockReset();
    directories.getPageOfUsers.mockReturnValue({
      users: [user1],
      numberOfPages: 1,
    });

    audit.getUserAudit.mockReset();
    audit.getUserAudit.mockImplementation((userId, pageNumber) => {
      if (pageNumber === 1) {
        return {
          audits: [{
            'type': 'change-password',
            'success': true,
            'userId': 'user1',
            'level': 'audit',
            'message': 'Successfully changed password for user.one@unit.test (id: user1)',
            'timestamp': '2017-11-02T07:30:18.987Z'
          }],
          numberOfPages: 3,
        };
      }
      if (pageNumber === 2) {
        return {
          audits: [{
            type: 'sign-in',
            subType: 'username-password',
            success: false,
            userId: 'user1',
            userEmail: 'user.one@unit.test',
            level: 'audit',
            message: 'Successful login attempt for user.one@unit.test (id: user1)',
            timestamp: '2017-10-24T12:35:51.633Z'
          }],
          numberOfPages: 3,
        };
      }
      return {
        audits: [{
          'type': 'change-password',
          'success': true,
          'userId': 'user1',
          'level': 'audit',
          'message': 'Successfully changed password for user.one@unit.test (id: user1)',
          'timestamp': '2017-11-02T07:30:18.987Z'
        }],
        numberOfPages: 3,
      };
    });

    await syncUsersView();

    expect(audit.getUserAudit.mock.calls).toHaveLength(3);
    expect(audit.getUserAudit.mock.calls[0][1]).toBe(1);
    expect(audit.getUserAudit.mock.calls[1][1]).toBe(2);
    expect(audit.getUserAudit.mock.calls[2][1]).toBe(3);
  });

  it('then it should update the new index with users', async () => {
    await syncUsersView();

    expect(users.updateIndex.mock.calls).toHaveLength(1);
    expect(users.updateIndex.mock.calls[0][0]).toHaveLength(2);
    expect(users.updateIndex.mock.calls[0][0][0]).toEqual({
      id: 'user1',
      name: 'User One',
      email: 'user.one@unit.test',
      organisation: {
        id: 'org1',
        name: 'Test Org'
      },
      lastLogin: 1508848551633,
      status: {
        id: 1,
        description: 'Active',
        changedOn: null,
      },
    });
    expect(users.updateIndex.mock.calls[0][0][1]).toEqual({
      id: 'user2',
      name: 'User Two',
      email: 'user.two@unit.test',
      organisation: {
        id: 'org1',
        name: 'Test Org'
      },
      lastLogin: 1508848551633,
      status: {
        id: 1,
        description: 'Active',
        changedOn: null,
      },
    });
    expect(users.updateIndex.mock.calls[0][1]).toBe('test-index');
  });

  it('then it should update config to point at new index', async () => {
    await syncUsersView();

    expect(users.updateActiveIndex.mock.calls).toHaveLength(1);
    expect(users.updateActiveIndex.mock.calls[0][0]).toBe('test-index');
  });

  it('then it should pass correlationId to directories', async () => {
    await syncUsersView();

    expect(directories.getPageOfUsers.mock.calls[0][1]).toBe('new-uuid');
  });

  it('then it should pass correlationId to organisations', async () => {
    await syncUsersView();

    expect(organisations.getUserOrganisations.mock.calls[0][1]).toBe('new-uuid');
    expect(organisations.getUserOrganisations.mock.calls[1][1]).toBe('new-uuid');
  });
});