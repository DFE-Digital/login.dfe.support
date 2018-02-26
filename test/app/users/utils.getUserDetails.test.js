jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/audit');

const { getUser } = require('./../../../src/infrastructure/directories');
const { getServicesByUserId } = require('./../../../src/infrastructure/organisations');
const { getUserLoginAuditsSince, getUserChangeHistory } = require('./../../../src/infrastructure/audit');
const { getUserDetails } = require('./../../../src/app/users/utils');

describe('When getting user details', () => {
  let req;

  beforeEach(() => {
    getServicesByUserId.mockReset();


    getUser.mockReset();
    getUser.mockReturnValue({
      sub: 'user1',
      given_name: 'Albus',
      family_name: 'Dumbledore',
      email: 'headmaster@hogwarts.com',
      password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
      salt: 'PasswordIs-password-',
    });

    getUserLoginAuditsSince.mockReset();
    getUserLoginAuditsSince.mockReturnValue([
      {
        type: "sign-in",
        subType: "username-password",
        success: true,
        userId: "user1",
        userEmail: "headmaster@hogwarts.com",
        level: "audit",
        message: "Successful login attempt for headmaster@hogwarts.com (id: user1)",
        timestamp: "2017-10-24T11:35:51.633Z"
      },
      {
        type: "sign-in",
        subType: "username-password",
        success: true,
        userId: "user1",
        userEmail: "headmaster@hogwarts.com",
        level: "audit",
        message: "Successful login attempt for headmaster@hogwarts.com (id: user1)",
        timestamp: "2017-10-24T12:35:51.633Z"
      },
      {
        type: "sign-in",
        subType: "username-password",
        success: false,
        userId: "user1",
        userEmail: "headmaster@hogwarts.com",
        level: "audit",
        message: "Failed login attempt for headmaster@hogwarts.com (id: user1)",
        timestamp: "2017-10-24T10:35:51.633Z"
      }
    ]);

    getUserChangeHistory.mockReset();
    getUserChangeHistory.mockReturnValue({
      audits: [{
        type: 'support',
        subType: 'user-edit',
        userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
        userEmail: "some.user@test.tester",
        editedUser: 'user1',
        editedFields: [
          {
            name: 'status',
            oldValue: 1,
            newValue: 0,
          }
        ],
        level: "audit",
        message: "Successful login attempt for headmaster@hogwarts.com (id: user1)",
        timestamp: "2017-10-24T12:35:51.633Z"
      }],
      numberOfPages: 1,
      numberOfRecords: 1,
    });

    req = {
      params: {
        uid: 'user1',
      },
    };
  });

  it('then it should get user from directories', async () => {
    await getUserDetails(req);

    expect(getUser.mock.calls).toHaveLength(1);
    expect(getUser.mock.calls[0][0]).toBe('user1');
  });

  it('then it should get user logins from audit', async () => {
    await getUserDetails(req);

    expect(getUserLoginAuditsSince.mock.calls).toHaveLength(1);
    expect(getUserLoginAuditsSince.mock.calls[0][0]).toBe('user1');
  });

  it('then it should map user and login data to result', async () => {
    const actual = await getUserDetails(req);

    expect(actual).toMatchObject({
      name: 'Albus Dumbledore',
      email: 'headmaster@hogwarts.com',
      lastLogin: new Date('2017-10-24T12:35:51.633Z'),
      status: {
        description: 'Active',
        changedOn: new Date("2017-10-24T12:35:51.633Z"),
      },
      loginsInPast12Months: {
        successful: 2,
      },
    });
  });
});
