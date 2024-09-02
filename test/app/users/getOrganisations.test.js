jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/serviceMapping');
jest.mock('./../../../src/infrastructure/audit');
jest.mock('ioredis');
const { getUserDetails } = require('./../../../src/app/users/utils');
const { getUserOrganisations, getPendingRequestsAssociatedWithUser } = require('./../../../src/infrastructure/organisations');
const { getUsersByIdV2 } = require('./../../../src/infrastructure/directories');
const { getClientIdForServiceId } = require('./../../../src/infrastructure/serviceMapping');
const { getUserLoginAuditsForService } = require('./../../../src/infrastructure/audit');
const getOrganisations = require('./../../../src/app/users/getOrganisations');

describe('when getting users organisation details', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
      user: {
        sub: 'user1',
        email: 'super.user@unit.test',
      },
      params: {
        uid: 'user1',
      },
      session: {},
    };

    res = {
      render: jest.fn(),
    };

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });

    getUserOrganisations.mockReset();
    getUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
          name: 'Great Big School',
          category: {
            id: '11',
            name: 'Government',
          },
        },
        approvers: [
          "user1",
        ],
      },
      {
        organisation: {
          id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
          name: 'Little Tiny School',
          category: {
            id: '11',
            name: 'Government',
          },
        },
        approvers: [
          "user1",
        ],
      },
    ]);

    getClientIdForServiceId.mockReset();
    getClientIdForServiceId.mockImplementation((serviceId) => {
      switch (serviceId) {
        case '83f00ace-f1a0-4338-8784-fa14f5943e5a':
          return 'client1';
        case '3ff78432-fb20-4ef7-83de-35b3fbb95159':
          return 'client2';
        case 'ae58ed71-4e0f-48d4-8577-4cf6f1b7d299':
          return 'client3';
      }
    });

    getUserLoginAuditsForService.mockReset();
    getUserLoginAuditsForService.mockImplementation((userId, clientId, pageNumber) => {
      switch (clientId) {
        case 'client1':
          return {
            audits: [{
              type: 'sign-in',
              subType: 'username-password',
              success: true,
              userId: '7a1b077a-d7d4-4b60-83e8-1a1b49849510',
              userEmail: 'some.user@test.tester',
              level: 'audit',
              message: 'Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)',
              timestamp: '2018-02-01T09:00:00.000Z'
            }],
            numberOfPages: 1,
          };
        case 'client2':
          return {
            audits: [{
              type: 'sign-in',
              subType: 'username-password',
              success: true,
              userId: '7a1b077a-d7d4-4b60-83e8-1a1b49849510',
              userEmail: 'some.user@test.tester',
              level: 'audit',
              message: 'Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)',
              timestamp: '2018-02-01T10:00:00.000Z'
            }],
            numberOfPages: 1,
          };
        case 'client3':
          return {
            audits: [{
              type: 'sign-in',
              subType: 'username-password',
              success: true,
              userId: '7a1b077a-d7d4-4b60-83e8-1a1b49849510',
              userEmail: 'some.user@test.tester',
              level: 'audit',
              message: 'Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)',
              timestamp: '2018-02-01T11:00:00.000Z'
            }],
            numberOfPages: 1,
          };
      }
    });

    getUsersByIdV2.mockReset();
    getUsersByIdV2.mockReturnValue(
      [
        { sub: 'user1', given_name: 'User', family_name:'One', email: 'user.one@unit.tests' },
        { sub: 'user6', given_name: 'User', family_name:'Six', email: 'user.six@unit.tests' },
        { sub: 'user11', given_name: 'User', family_name: 'Eleven', email: 'user.eleven@unit.tests' },
      ]
    );
    getPendingRequestsAssociatedWithUser.mockReset();
    getPendingRequestsAssociatedWithUser.mockReturnValue([{
      id: 'requestId',
      org_id: 'organisationId',
      org_name: 'organisationName',
      user_id: 'user2',
      status: {
        id: 0,
        name: 'pending',
      },
      created_date: '2019-08-12',
    }]);
  });

  it('then it should get user details', async () => {
    await getOrganisations(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
    expect(res.render.mock.calls[0][1].user).toMatchObject({
      id: 'user1',
    });
  });

  it('then it should get organisations and requests mapping for user', async () => {
    await getOrganisations(req, res);

    expect(getUserOrganisations.mock.calls).toHaveLength(1);
    expect(getUserOrganisations.mock.calls[0][0]).toBe('user1');
    expect(getUserOrganisations.mock.calls[0][1]).toBe('correlationId');

    expect(getPendingRequestsAssociatedWithUser.mock.calls).toHaveLength(1);
    expect(getPendingRequestsAssociatedWithUser.mock.calls[0][0]).toBe('user1');
    expect(getPendingRequestsAssociatedWithUser.mock.calls[0][1]).toBe('correlationId');

    expect(res.render.mock.calls[0][1].organisations).toHaveLength(3);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
      name: 'Great Big School',
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
      name: 'Little Tiny School',
    });
    expect(res.render.mock.calls[0][1].organisations[2]).toMatchObject({
      id: 'organisationId',
      name: 'organisationName',
      requestId: 'requestId',
    });
  });

});
