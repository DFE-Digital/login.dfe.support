jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/audit');
jest.mock('./../../../src/infrastructure/users');

const { getUser } = require('./../../../src/infrastructure/directories');
const { getServicesByUserId } = require('./../../../src/infrastructure/organisations');
const { getUserLoginAuditsSince, getUserChangeHistory } = require('./../../../src/infrastructure/audit');
const users = require('./../../../src/infrastructure/users');
const { getUserDetails } = require('./../../../src/app/users/utils');

describe('When getting user details', () => {
  let req;

  beforeEach(() => {
    getServicesByUserId.mockReset();

    users.getById.mockReset();
    users.getById.mockReturnValue({
      id: 'user1',
      name: 'Albus Dumbledore',
      firstName: 'Albus',
      lastName: 'Dumbledore',
      email: 'headmaster@hogwarts.com',
      organisation: null,
      lastLogin: new Date('2017-10-24T12:35:51.633Z'),
      successfulLoginsInPast12Months: 2,
      status: {
        id: 1,
        description: 'Active',
        changedOn: new Date("2017-10-24T12:35:51.633Z"),
      },
    });

    req = {
      params: {
        uid: 'user1',
      },
    };
  });

  it('then it should get user from users index', async () => {
    await getUserDetails(req);

    expect(users.getById.mock.calls).toHaveLength(1);
    expect(users.getById.mock.calls[0][0]).toBe('user1');
  });

  it('then it should map user and login data to result', async () => {
    const actual = await getUserDetails(req);

    expect(actual).toMatchObject({
      name: 'Albus Dumbledore',
      firstName: 'Albus',
      lastName: 'Dumbledore',
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
