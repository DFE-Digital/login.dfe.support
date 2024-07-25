jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  support: {
    type: 'api',
    service: {
      url: 'http://support.test',
    },
  },
}));

const rp  = require('login.dfe.request-promise-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');

const { 
  getSingleServiceForUser, 
  addOrChangeManageConsoleServiceTitle, 
  checkIfRolesChanged,
  postManageConsoleRoles
} = require('./../../../src/app/users/getManageConsoleRoles');

const { getServiceById } = require('./../../../src/infrastructure/applications');
const { getSingleUserService, getSingleInvitationService, listRolesOfService } = require('./../../../src/infrastructure/access');
const { getUserDetails } = require('./../../../src/app/users/utils');

jest.mock('./../../../src/infrastructure/applications', () => ({
  getServiceById: jest.fn(),
}));

jest.mock('./../../../src/app/users/utils', () => ({
  getUserDetails: jest.fn(),
}));

jest.mock('./../../../src/infrastructure/access', () => ({
    listRolesOfService: jest.fn(),
    getSingleUserService: jest.fn(),
    getSingleInvitationService: jest.fn(),
    updateUserService: jest.fn(),
  }));

jest.mock('request-promise');
jest.mock('login.dfe.jwt-strategies');
 
const { updateUserService } = require('./../../../src/infrastructure/access');
// const { listRolesOfService } = require('../../../src/infrastructure/access/static');

describe('updateUserService', () => {
  // let getBearerTokenMock;
 
  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
      user: {
      sub: 'user1',
      email: 'super.user@unit.test',
      },
      body: {
        role: ['role1', 'role2']
      },
      params: {
          uid: 'userId',
          sid: 'service-id'
      },
      session: {},
  };

  res = {
      render: jest.fn(),
      flash: jest.fn(),
      redirect: jest.fn(),
  };

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })

    getServiceById.mockResolvedValue({ name: 'test service', id: 'service1Id'});
    getSingleUserService.mockResolvedValue({ serviceId: 'service-id', roles: ['role1'] });
    getUserDetails.mockReturnValue({ id: 'userId'});
    getSingleInvitationService.mockResolvedValue({ serviceId: 'service-id', roles: ['role1'] });
    listRolesOfService.mockResolvedValue([
      {
        id: 'role1Id',
        name: 'test service 1 - Service Access Management',
        code: 'service1Id_accessManage',
        numericId: '23173',
        status: { id: 1 }
      },
      {
        id: 'role2Id',
        name: 'test service 1 - Service Banner',
        code: 'service1Id_serviceBanner',
        numericId: '23175',
        status: { id: 1 }
      },
      {
        id: 'role3Id',
        name: 'test service 1 - Service Configuration',
        code: 'service1Id_serviceconfig',
        numericId: '23172',
        status: { id: 1 }
      },
      {
        id: 'role4Id',
        name: 'test service 1 - Service Support',
        code: 'not-service1Id_serviceSup',
        numericId: '23174',
        status: { id: 1 }
      }
    ])
      
  });
 
  afterEach(() => {
    jest.clearAllMocks();
  });
 
  it('should successfully update user service', async () => {
    
    await postManageConsoleRoles(req, res)
    // await updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId');

    expect(updateUserService.mock.calls).toHaveLength(1);
    expect(updateUserService.mock.calls[0][0]).toBe('userId');
    expect(updateUserService.mock.calls[0][1]).toBe('service1Id');
    expect(updateUserService.mock.calls[0][2]).toBe('');
    // expect(updateUserService.mock.calls[0][2]).toBe('3de9d503-6609-4239-ba55-14f8ebd69f56');
    // expect(updateUserService.mock.calls[0][3]).toEqual();
    expect(updateUserService.mock.calls[0][4]).toBe('correlationId');

    expect(res.flash.mock.calls[0][1]).toEqual(["Roles updated", "The selected roles have been updated for test service"]);
    // expect(rp).toHaveBeenCalledTimes(1);
    // expect(rp).toHaveBeenCalledWith(expect.objectContaining({
    //   method: 'PATCH',
    //   uri: `${config.access.service.url}/users/userId/services/serviceId/organisations/organisationId`,
    //   headers: {
    //     authorization: `bearer ${token}`,
    //     'x-correlation-id': 'correlationId',
    //   },
    //   body: { roles: ['role1', 'role2'] },
    //   json: true,
    // }));
  });
  
  // test('then you are redirected to the access requests page with a flash message', async () => {
  //   await post(req, res);

  //   expect(res.flash.mock.calls[0][1]).toBe('Access request approved. test user is now associated with test org');
  //   expect(res.redirect.mock.calls).toHaveLength(1);
  //   expect(res.redirect.mock.calls[0][0]).toBe('/access-requests');
  // });
  // it('should return false for 403 status code', async () => {
  //   const token = 'mockToken';
  //   const error = new Error('Forbidden');
  //   error.statusCode = 403;
  //   getBearerTokenMock.mockResolvedValue(token);
  //   rp.mockRejectedValue(error);
 
  //   const result = await updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId');
  //   expect(result).toBe(false);
  //   expect(getBearerTokenMock).toHaveBeenCalledTimes(1);
  //   expect(rp).toHaveBeenCalledTimes(1);
  // });
 
  // it('should return false for 409 status code', async () => {
  //   const token = 'mockToken';
  //   const error = new Error('Conflict');
  //   error.statusCode = 409;
  //   getBearerTokenMock.mockResolvedValue(token);
  //   rp.mockRejectedValue(error);
 
  //   const result = await updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId');
  //   expect(result).toBe(false);
  //   expect(getBearerTokenMock).toHaveBeenCalledTimes(1);
  //   expect(rp).toHaveBeenCalledTimes(1);
  // });
 
  // it('should throw error for other status codes', async () => {
  //   //const token = 'mockToken';
  //   const error = new Error('Internal Server Error');
  //   error.statusCode = 500;
  //   //getBearerTokenMock.mockResolvedValue(token);
  //   rp.mockRejectedValue(error);
 
  //   await expect(updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId')).rejects.toThrow(error);
  //   expect(getBearerTokenMock).toHaveBeenCalledTimes(1);
  //   expect(rp).toHaveBeenCalledTimes(1);
  // });
});


// const { 
//     getSingleServiceForUser, 
//     addOrChangeManageConsoleServiceTitle, 
//     checkIfRolesChanged 
//   } = require('./../../../src/app/users/getManageConsoleRoles');
  
//   jest.mock('./../../../src/infrastructure/utils', () => ({
//     sendResult: jest.fn(),
//   }));
  
//   jest.mock('./../../../src/app/users/utils', () => ({
//     getUserDetails: jest.fn(),
//   }));
  
//   jest.mock('./../../../src/infrastructure/applications', () => ({
//     getServiceById: jest.fn(),
//   }));
  
//   jest.mock('./../../../src/infrastructure/access', () => ({
//     listRolesOfService: jest.fn(),
//     getSingleUserService: jest.fn(),
//     getSingleInvitationService: jest.fn(),
//     updateUserService: jest.fn(),
//   }));
  
//   describe('updateUserService', () => {

//   })