jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/serviceMapping');
jest.mock('./../../../src/infrastructure/audit');

const { getUserDetails } = require('./../../../src/app/users/utils');
const { getUserOrganisations } = require('./../../../src/infrastructure/organisations');
const { getUserDevices } = require('./../../../src/infrastructure/directories');
const { getClientIdForServiceId } = require('./../../../src/infrastructure/serviceMapping');
const { getUserLoginAuditsForService } = require('./../../../src/infrastructure/audit');
const getServices = require('./../../../src/app/users/getServices');

describe('when getting users service details', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
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
        id: '83f00ace-f1a0-4338-8784-fa14f5943e5a',
        name: 'Some service',
        description: 'Some service that does some stuff',
        status: 1,
        userId: '7a1b077a-d7d4-4b60-83e8-1a1b49849510',
        requestDate: '2018-01-18T10:46:59.385Z',
        approvers: [],
        organisation: {
          id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
          name: 'Big School'
        },
        role: {
          id: 0,
          name: 'End user'
        },
      },
      {
        id: '3ff78432-fb20-4ef7-83de-35b3fbb95159',
        name: 'Some other service',
        description: 'Some service that does some stuff',
        status: 1,
        userId: '7a1b077a-d7d4-4b60-83e8-1a1b49849510',
        requestDate: '2018-01-18T10:56:59.385Z',
        approvers: [],
        organisation: {
          id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
          name: 'Big School'
        },
        role: {
          id: 0,
          name: 'End user'
        },
      },
      {
        id: 'ae58ed71-4e0f-48d4-8577-4cf6f1b7d299',
        name: 'Yet another service',
        description: 'Some service that does some stuff',
        status: 1,
        userId: '7a1b077a-d7d4-4b60-83e8-1a1b49849510',
        requestDate: '2018-01-19T10:46:59.385Z',
        approvers: [],
        organisation: {
          id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
          name: 'Small School'
        },
        role: {
          id: 10000,
          name: 'Approver'
        },
      },
    ]);

    getUserDevices.mockReset();
    getUserDevices.mockReturnValue([
      {
        type: 'digipass',
        serialNumber: '9999999999',
      }
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
    })
  });

  it('then it should get user details', async () => {
    await getServices(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
    expect(res.render.mock.calls[0][1].user).toMatchObject({
      id: 'user1',
    });
  });

  it('then it should get organisations mapping for user', async () => {
    await getServices(req, res);

    expect(getUserOrganisations.mock.calls).toHaveLength(1);
    expect(getUserOrganisations.mock.calls[0][0]).toBe('user1');
    expect(getUserOrganisations.mock.calls[0][1]).toBe('correlationId');
    
    expect(res.render.mock.calls[0][1].organisations).toHaveLength(2);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
      name: 'Big School',
      services:[
        {
          id: '83f00ace-f1a0-4338-8784-fa14f5943e5a',
          name: 'Some service',
          userType: {
            id: 0,
            name: 'End user'
          },
          grantedAccessOn: new Date('2018-01-18T10:46:59.385Z'),
          approvers: [],
        },
        {
          id: '3ff78432-fb20-4ef7-83de-35b3fbb95159',
          name: 'Some other service',
          userType: {
            id: 0,
            name: 'End user'
          },
          grantedAccessOn: new Date('2018-01-18T10:56:59.385Z'),
          approvers: [],
        },
      ]
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
      name: 'Small School',
      services:[
        {
          id: 'ae58ed71-4e0f-48d4-8577-4cf6f1b7d299',
          name: 'Yet another service',
          userType: {
            id: 10000,
            name: 'Approver'
          },
          grantedAccessOn: new Date('2018-01-19T10:46:59.385Z'),
          approvers: [],
        },
      ]
    });
  });

  it('then it should get last login for each org/service', async () => {
    await getServices(req, res);

    expect(getClientIdForServiceId.mock.calls).toHaveLength(3);
    expect(getClientIdForServiceId.mock.calls[0][0]).toBe('83f00ace-f1a0-4338-8784-fa14f5943e5a');
    expect(getClientIdForServiceId.mock.calls[1][0]).toBe('3ff78432-fb20-4ef7-83de-35b3fbb95159');
    expect(getClientIdForServiceId.mock.calls[2][0]).toBe('ae58ed71-4e0f-48d4-8577-4cf6f1b7d299');

    expect(getUserLoginAuditsForService.mock.calls).toHaveLength(3);
    expect(getUserLoginAuditsForService.mock.calls[0][1]).toBe('client1');
    expect(getUserLoginAuditsForService.mock.calls[1][1]).toBe('client2');
    expect(getUserLoginAuditsForService.mock.calls[2][1]).toBe('client3');

    expect(res.render.mock.calls[0][1].organisations[0].services[0].lastLogin).toEqual(new Date('2018-02-01T09:00:00.000Z'));
    expect(res.render.mock.calls[0][1].organisations[0].services[1].lastLogin).toEqual(new Date('2018-02-01T10:00:00.000Z'));
    expect(res.render.mock.calls[0][1].organisations[1].services[0].lastLogin).toEqual(new Date('2018-02-01T11:00:00.000Z'));
  });

  it('then it should get token for each org/service', async () => {
    await getServices(req, res);

    expect(res.render.mock.calls[0][1].organisations[0].services[0].token).toMatchObject({
      type: 'digipass',
      serialNumber: '99-9999999-9',
    });
    expect(res.render.mock.calls[0][1].organisations[0].services[1].token).toMatchObject({
      type: 'digipass',
      serialNumber: '99-9999999-9',
    });
    expect(res.render.mock.calls[0][1].organisations[1].services[0].token).toMatchObject({
      type: 'digipass',
      serialNumber: '99-9999999-9',
    });
  });
});
