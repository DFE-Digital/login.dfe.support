// eslint-disable-next-line global-require
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils', () => ({
  sendResult: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/applications', () => ({
  getAllServices: jest.fn(),
  getPageOfService: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/access', () => ({
  getServicesByUserId: jest.fn(),
}));
jest.mock('./../../../src/app/users/utils', () => ({
  getUserDetails: jest.fn(),
}));


const getManageConsoleServices = require('./../../../src/app/users/getManageConsoleServices');
const { sendResult } = require('./../../../src/infrastructure/utils');
const { getAllServices, getPageOfService } = require('./../../../src/infrastructure/applications');
const { getServicesByUserId } = require('./../../../src/infrastructure/access');
const { getUserDetails } = require('./../../../src/app/users/utils');

describe('When retrieving manage console services for a user', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: 'GET',
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

    getServicesByUserId.mockReset();
    getServicesByUserId.mockReturnValue([
      {
        userId: "user-1",
        serviceId: "service1Id",
        organisationId: "organisation-1",
        roles: [],
      },
      {
        userId: "user-1",
        serviceId: "service2Id",
        organisationId: "organisation-1",
        roles: [],
      },
      {
        userId: "user-1",
        serviceId: "service3Id",
        organisationId: "organisation-1",
        roles: [],
      },
      {
        userId: "user-1",
        serviceId: "service4Id",
        organisationId: "organisation-1",
        roles: [],
      },
    ]);


    const allServices = {
      services: [
        {
          id: 'service1Id',
          name: 'Service 1',
          description: 'Service for testing purposes',
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        },
        {
          id: 'service2Id',
          name: 'Service 2',
          description: 'Service for testing purposes',
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        },
        {
          id: 'service3Id',
          name: 'Service 3',
          description: 'Service for testing purposes',
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        }
      ]
    };
    
    getAllServices.mockReset();
    getAllServices.mockReturnValue(allServices);
    
    const pageOfServices = {
      services: [
        {
          id: 'service1Id',
          name: 'Service 1',
          description: 'Service for testing purposes',
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        },
        {
          id: 'service2Id',
          name: 'Service 2',
          description: 'Service for testing purposes',
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        },
        {
          id: 'service3Id',
          name: 'Service 3',
          description: 'Service for testing purposes',
          isExternalService: true,
          isIdOnlyService: false,
          isHiddenService: false,
          relyingParty: {},
        }
      ]
    };

    getPageOfService.mockReset();
    getPageOfService.mockReturnValue(pageOfServices);
  });
  
  it('should call getUserDetails', async () => {
    await getManageConsoleServices(req, res);

    expect(getUserDetails).toHaveBeenCalled();
    expect(getUserDetails.mock.calls[0]).toHaveLength(1);
    expect(sendResult.mock.calls[0][3].user).toMatchObject({
      id: 'user1',
    });
  });

  it('should call getPageOfService', async () => {
    await getManageConsoleServices(req, res);

    expect(getPageOfService).toHaveBeenCalled();
    expect(getPageOfService).toReturnWith(
      {
        "services": [
          {
            "description": "Service for testing purposes",
            "id": "service1Id",
            "isExternalService": true,
            "isHiddenService": false,
            "isIdOnlyService": false,
            "name": "Service 1",
            "relyingParty": {}
          },
          {
            "description": "Service for testing purposes",
            "id": "service2Id",
            "isExternalService": true,
            "isHiddenService": false,
            "isIdOnlyService": false,
            "name": "Service 2",
            "relyingParty": {}
          },
          {
            "description": "Service for testing purposes",
            "id": "service3Id",
            "isExternalService": true,
            "isHiddenService": false,
            "isIdOnlyService": false,
            "name": "Service 3",
            "relyingParty": {}
          }
        ]
      },
    );

    const getPageOfServiceResult = getPageOfService();
    expect(getPageOfServiceResult.services[0].id).toBe('service1Id');
  });

  it('should set pageOfServices to {services: []} if a undefined is returned from getPageOfService call', async () => {
    getPageOfService.mockReturnValue(undefined);

    await getManageConsoleServices(req, res);

    expect(sendResult.mock.calls[0][3].pageOfServices).toMatchObject({
      services: []
    });
  })

  it('should call sendResult', async () => {
    await getManageConsoleServices(req, res);

    expect(sendResult).toHaveBeenCalled();
    expect(sendResult.mock.calls[0][3].user).toMatchObject({
      id: 'user1',
    });
    expect(sendResult.mock.calls[0][3].pageOfServices.services[0]).toMatchObject({
      id: 'service1Id',
      name: 'Service 1',
      description: 'Service for testing purposes',
      isExternalService: true,
      isIdOnlyService: false,
      isHiddenService: false,
      relyingParty: {},
    });
  });
});

