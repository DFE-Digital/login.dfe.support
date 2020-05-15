jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  directories: {
    type: 'api',
    service: {
      url: 'http://directories.test',
    },
  },
}));

const rp  = require('login.dfe.request-promise-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { deleteUserDevice } = require('./../../../src/infrastructure/directories/api');

const correlationId = 'abc123';
const userId = 'user1';
const serialNumber = '88774433';
const apiResponse = [
  {
    "id": "6eebc499-e69e-4556-95e5-dc0300c12748",
    "type": "digipass",
    "serialNumber": "1234567890"
  }
];

describe('when deleting a user device in the directories api', () => {
  beforeEach(() => {
    rp.mockReset();
    rp.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });


  it('then it should call directories resource with uid', async () => {
    await deleteUserDevice(userId, serialNumber, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'DELETE',
      uri: 'http://directories.test/users/user1/devices',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await deleteUserDevice(userId, serialNumber, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await deleteUserDevice(userId, serialNumber, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('then it will include in the body the serialNumber and type', async () => {
    await deleteUserDevice(userId, serialNumber, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      body: {
        type: 'digipass',
        serialNumber: serialNumber
      },
    });
  });
});
