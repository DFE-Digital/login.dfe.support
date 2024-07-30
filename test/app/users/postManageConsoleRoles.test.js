//jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  support: {
    type: 'api',
    service: {
      url: 'http://support.test',
    },
  },
  access: {
    identifiers: {
      service: "service1",
      organisation: "organisation1",
      departmentForEducation: "departmentForEducation1"
    }
  }
}));

//const rp  = require('login.dfe.request-promise-retry');
jest.mock('login.dfe.policy-engine');

const jwtStrategy = require('login.dfe.jwt-strategies');
jest.mock('login.dfe.jwt-strategies');

const postManageConsoleRoles = require('./../../../src/app/users/postManageConsoleRoles');

// const { 
//   postManageConsoleRoles
// } = require('./../../../src/app/users/getManageConsoleRoles');


const { getServiceById } = require('./../../../src/infrastructure/applications');
const { getSingleUserService, getSingleInvitationService, listRolesOfService } = require('./../../../src/infrastructure/access');
const { getUserDetails } = require('./../../../src/app/users/utils');

const { 
  getSingleServiceForUser, 
  addOrChangeManageConsoleServiceTitle,
  checkIfRolesChanged
} = require('./../../../src/app/users/getManageConsoleRoles');

jest.mock('./../../../src/app/users/getManageConsoleRoles');

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

const { updateUserService } = require('./../../../src/infrastructure/access');

describe('updateUserService', () => {

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
        role: ['role1Id', 'role2Id']
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
        name: 'test service 2 - Service Support',
        code: 'service2Id_serviceSup',
        numericId: '23174',
        status: { id: 1 }
      }
    ])
      
  });
 
  afterEach(() => {
    jest.clearAllMocks();
  });
 
  it('should successfully update user service', async () => {
    
    await postManageConsoleRoles(req, res);

    expect(getServiceById).toHaveBeenCalled()

    // expect(updateUserService.mock.calls).toHaveLength(1);
  //   expect(updateUserService.mock.calls[0][0]).toBe('userId');
  //   expect(updateUserService.mock.calls[0][1]).toBe('service1Id');
  //   // expect(updateUserService.mock.calls[0][2]).toBe('');
  //   // check the selected rolesare passed in to updateUserService
  //   // expect(updateUserService.mock.calls[0][2]).toBe(['role1Id', 'role2Id']);
  //   expect(updateUserService.mock.calls[0][4]).toBe('correlationId');
  });
  
  // it('should then redirect the user to the manage console services endpoint with a flash message', async () => {
  //   await postManageConsoleRoles(req, res)

  //   expect(res.flash.mock.calls[0][1]).toEqual(["Roles updated", "The selected roles have been updated for test service"]);
  //   expect(res.redirect.mock.calls).toHaveLength(1);
  //   expect(res.redirect.mock.calls[0][0]).toBe('/users/userId/manage-console-services');
  // })
});