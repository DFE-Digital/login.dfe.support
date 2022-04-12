jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/userDevices');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/audit/cache');
jest.mock('./../../../src/infrastructure/audit');
jest.mock('./../../../src/infrastructure/devices');
jest.mock('uuid');
jest.mock('ioredis');

const userDevices = require('./../../../src/infrastructure/userDevices');
const directories = require('./../../../src/infrastructure/directories');
const organisations = require('./../../../src/infrastructure/organisations');
const audit = require('./../../../src/infrastructure/audit');
const devices = require('./../../../src/infrastructure/devices');
const {v4:uuid} = require('uuid');
const syncUserDevicesView = require('./../../../src/app/syncViews/syncUserDevicesView');

const user1 = {
  sub: 'user1',
  given_name: 'User',
  family_name: 'One',
  email: 'user.one@unit.test',
  password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
  salt: 'PasswordIs-password-',
  devices: [
    {
      id: '6eebc499-e69e-4556-95e5-dc0300c12748',
      status: 'Active',
      serialNumber: '1234567890'
    }
  ]
};
const user2 = {
  sub: 'user2',
  given_name: 'User',
  family_name: 'Two',
  email: 'user.two@unit.test',
  password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
  salt: 'PasswordIs-password-',
};

describe('When syncing userDevices materialised view', function () {
  beforeEach(() => {
    userDevices.createIndex.mockReset();
    userDevices.createIndex.mockReturnValue('test-index');

    userDevices.updateIndex.mockReset();

    directories.getPageOfUsers.mockReset();
    directories.getPageOfUsers.mockReturnValue({
      users: [user1, user2],
      numberOfPages: 1,
    });

    directories.getUserDevices.mockReset();
    directories.getUserDevices.mockReturnValueOnce([
      {
        "id": "6eebc499-e69e-4556-95e5-dc0300c12748",
        "type": "digipass",
        "serialNumber": "1234567890"
      }
    ]);
    directories.getUserDevices.mockReturnValue(null);

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

    audit.cache.getStatsForUser.mockReset().mockReturnValue({
      lastLogin: new Date('2017-10-24T12:35:51.633Z'),
      loginsInPast12Months: [
        { timestamp: new Date('2017-10-24T12:35:51.633Z') },
      ],
      lastStatusChange: undefined,
    });

    devices.getDevices.mockReset();
    devices.getDevices.mockReturnValue(
      [
        {
          "serialNumber": "1234567890"
        },
        {
          "serialNumber": "2234567890"
        }
      ]
    );

    uuid.mockImplementation(() => {
      return 'new-uuid';
    });
  });

  it('then it should create a new index', async () => {
    await syncUserDevicesView();

    expect(userDevices.createIndex.mock.calls).toHaveLength(1);
  });

  it('then it should keep getting pages of users from directories until it reaches the end', async () => {
    directories.getPageOfUsers.mockReset();
    directories.getPageOfUsers.mockImplementation(() => {
      return {
        users: [],
        numberOfPages: 2,
      };
    });

    await syncUserDevicesView();

    expect(directories.getPageOfUsers.mock.calls).toHaveLength(2);
    expect(directories.getPageOfUsers.mock.calls[0][0]).toBe(1);
    expect(directories.getPageOfUsers.mock.calls[1][0]).toBe(2);
  });
  it('then it will get all of the device serial numbers', async () => {
    await syncUserDevicesView();

    expect(devices.getDevices.mock.calls).toHaveLength(1);
  });
  it('then it will not get information if there is no digipass associated to the user', async () => {
    const u1 = Object.assign({}, user1);
    const u2 = Object.assign({}, user2);
    u1.devices = undefined;
    u2.devices = undefined;
    directories.getPageOfUsers.mockReturnValue({
      users: [u1, u2],
      numberOfPages: 1,
    });

    await syncUserDevicesView();

    expect(organisations.getUserOrganisations.mock.calls).toHaveLength(0);
  });
  it('then it should get organisations for each user that has a device', async () => {
    await syncUserDevicesView();

    expect(organisations.getUserOrganisations.mock.calls).toHaveLength(1);
    expect(organisations.getUserOrganisations.mock.calls[0][0]).toBe(user1.sub);
  });

  it('then it should update the new index with users', async () => {
    await syncUserDevicesView();

    expect(userDevices.updateIndex.mock.calls).toHaveLength(2);
    expect(userDevices.updateIndex.mock.calls[0][0]).toHaveLength(1);
    expect(userDevices.updateIndex.mock.calls[0][0][0]).toEqual({
      id: 'user1',
      name: 'User One',
      email: 'user.one@unit.test',
      organisation: {
        id: 'org1',
        name: 'Test Org'
      },
      lastLogin: 1508848551633,
      device: {
        id: '6eebc499-e69e-4556-95e5-dc0300c12748',
        status: 'Active',
        serialNumber: '1234567890'
      }
    });
    expect(userDevices.updateIndex.mock.calls[0][1]).toBe('test-index');
  });

  it('then it should update config to point at new index', async () => {
    await syncUserDevicesView();

    expect(userDevices.updateActiveIndex.mock.calls).toHaveLength(1);
    expect(userDevices.updateActiveIndex.mock.calls[0][0]).toBe('test-index');
  });

  it('then it should pass correlationId to directories', async () => {
    await syncUserDevicesView();

    expect(directories.getPageOfUsers.mock.calls[0][6]).toBe('new-uuid');
  });

  it('then it should pass correlationId to organisations', async () => {
    await syncUserDevicesView();

    expect(organisations.getUserOrganisations.mock.calls[0][1]).toBe('new-uuid');
  });
  it('then it should pass correlationId to devices', async () => {
    await syncUserDevicesView();

    expect(devices.getDevices.mock.calls[0][0]).toBe('new-uuid');
  });

  it('then all devices not assigned are added to the index', async () => {
    await syncUserDevicesView();

    expect(userDevices.updateIndex.mock.calls[1][0]).toEqual([{
      id: 'new-uuid',
      name: undefined,
      email: undefined,
      organisation: undefined,
      lastLogin: undefined,
      device: {
        id: undefined,
        status: 'Unassigned',
        serialNumber: '2234567890'
      }
    }]);
  });
  it('then unassigned devices are batched when updating indexes', async () => {
    const devicesResult = [];
    for (let i = 0; i < 501; i++) {
      devicesResult[i] = {
        "serialNumber": `00000${i}`
      };
    }
    devices.getDevices.mockReturnValue(devicesResult);
    const u1 = Object.assign({}, user1);
    const u2 = Object.assign({}, user2);
    u1.devices = undefined;
    u2.devices = undefined;
    directories.getPageOfUsers.mockReturnValue({
      users: [u1, u2],
      numberOfPages: 1,
    });

    await syncUserDevicesView();

    expect(userDevices.updateIndex.mock.calls).toHaveLength(2);
  });
});