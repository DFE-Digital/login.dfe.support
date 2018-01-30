jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/serviceMapping');
jest.mock('./../../../src/infrastructure/audit');

const { getUserDetails } = require('./../../../src/app/users/utils');
const { sendResult } = require('./../../../src/infrastructure/utils');
const { getUserAudit } = require('./../../../src/infrastructure/audit');
const { getServiceIdForClientId } = require('./../../../src/infrastructure/serviceMapping');
const { getServiceById } = require('./../../../src/infrastructure/organisations');
const getAudit = require('./../../../src/app/users/getAudit');

describe('when getting users audit details', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
      query: {
        page: 1,
      },
    };

    res = {
      render: jest.fn(),
    };

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });

    sendResult.mockReset();

    getUserAudit.mockReset();
    getUserAudit.mockReturnValue({
      audits: [
        {
          type: 'sign-in',
          subType: 'digipass',
          success: false,
          userId: 'user1',
          userEmail: 'some.user@test.tester',
          level: 'audit',
          message: 'Successful login attempt for some.user@test.tester (id: user1)',
          timestamp: '2018-01-30T10:31:00.000Z',
          client: 'client-1'
        },
        {
          type: 'sign-in',
          subType: 'username-password',
          success: true,
          userId: 'user1',
          userEmail: 'some.user@test.tester',
          level: 'audit',
          message: 'Successful login attempt for some.user@test.tester (id: user1)',
          timestamp: '2018-01-30T10:30:53.987Z',
          client: 'client-2'
        },
        {
          type: 'some-new-type',
          subType: 'some-subtype',
          success: false,
          userId: 'user1',
          userEmail: 'some.user@test.tester',
          level: 'audit',
          message: 'Some detailed message',
          timestamp: '2018-01-29T17:31:00.000Z'
        },
      ],
      numberOfPages: 3,
    });

    getServiceIdForClientId.mockReset();
    getServiceIdForClientId.mockImplementation((clientId) => {
      if (clientId === 'client-1') {
        return 'service-1';
      }
      if (clientId === 'client-2') {
        return 'service-2';
      }
      return null;
    });

    getServiceById.mockReset();
    getServiceById.mockImplementation((serviceId) => {
      return {
        id: serviceId,
        name: serviceId,
        description: serviceId,
      };
    });
  });

  it('then it should send result using audit view', async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls).toHaveLength(1);
    expect(sendResult.mock.calls[0][0]).toBe(req);
    expect(sendResult.mock.calls[0][1]).toBe(res);
    expect(sendResult.mock.calls[0][2]).toBe('users/views/audit');
  });

  it('then it should include csrf token in model', async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include user details in model', async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      user: {
        id: 'user1'
      },
    });
  });

  it('then it should include number of pages of audits in model', async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      numberOfPages: 3,
    });
  });

  it('then it should include current page of audits in model', async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      audits: [
        {
          timestamp: new Date('2018-01-30T10:31:00.000Z'),
          event: {
            type: 'sign-in',
            subType: 'digipass',
            description: 'Sign-in using a digipass key fob',
          },
          service: {
            id: 'service-1',
            name: 'service-1',
            description: 'service-1',
          },
          result: false,
          user: {
            id: 'user1'
          },
        },
        {
          timestamp: new Date('2018-01-30T10:30:53.987Z'),
          event: {
            type: 'sign-in',
            subType: 'username-password',
            description: 'Sign-in using email address and password',
          },
          service: {
            id: 'service-2',
            name: 'service-2',
            description: 'service-2',
          },
          result: true,
          user: {
            id: 'user1'
          },
        },
        {
          timestamp: new Date('2018-01-29T17:31:00.000Z'),
          event: {
            type: 'some-new-type',
            subType: 'some-subtype',
            description: 'some-new-type / some-subtype',
          },
          service: null,
          result: false,
          user: {
            id: 'user1'
          },
        },
      ],
    });
  });

  it('then it should get user details', async () => {
    await getAudit(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
  });

  it('then it should get page of audits using page 1 if page not specified', async () => {
    await getAudit(req, res);

    expect(getUserAudit.mock.calls).toHaveLength(1);
    expect(getUserAudit.mock.calls[0][0]).toBe('user1');
    expect(getUserAudit.mock.calls[0][1]).toBe(1);
  });

  it('then it should get service for each audit that has client', async () => {
    await getAudit(req, res);

    expect(getServiceIdForClientId.mock.calls).toHaveLength(2);
    expect(getServiceIdForClientId.mock.calls[0][0]).toBe('client-1');
    expect(getServiceIdForClientId.mock.calls[1][0]).toBe('client-2');

    expect(getServiceById.mock.calls).toHaveLength(2);
    expect(getServiceById.mock.calls[0][0]).toBe('service-1');
    expect(getServiceById.mock.calls[1][0]).toBe('service-2');
  });
});
