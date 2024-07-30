// Mock dependencies
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
jest.mock('login.dfe.policy-engine');
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

// Import dependencies
const jwtStrategy = require('login.dfe.jwt-strategies');
const postManageConsoleRoles = require('./../../../src/app/users/postManageConsoleRoles');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const { getSingleUserService, listRolesOfService, updateUserService } = require('./../../../src/infrastructure/access');
const { getSingleServiceForUser, checkIfRolesChanged } = require('./../../../src/app/users/getManageConsoleRoles');

describe('when changing a user\'s manage console access', () => {
  let req, res;

  // Common setup
  beforeAll(() => {
    jwtStrategy.mockImplementation(() => ({
      getBearerToken: jest.fn().mockReturnValue('token'),
    }));
  });

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
        sid: 'testService1'
      },
      session: {},
    };

    res = {
      render: jest.fn(),
      flash: jest.fn(),
      redirect: jest.fn(),
    };

    listRolesOfService.mockResolvedValue([
      { id: 'role1', name: 'test service 1 - Service Access Management', code: 'testService1_accessManage', numericId: '23173', status: { id: 1 } },
      { id: 'role2', name: 'test service 1 - Service Banner', code: 'testService1_serviceBanner', numericId: '23175', status: { id: 1 } },
      { id: 'role3', name: 'test service 1 - Service Configuration', code: 'testService1_serviceconfig', numericId: '23172', status: { id: 1 } },
      { id: 'role4', name: 'test service 2 - Service Support', code: 'testService1_serviceSup', numericId: '23174', status: { id: 1 } },
    ]);

    getServiceById.mockResolvedValue({ name: 'Test Service', id: 'testService1' });
    getSingleUserService.mockResolvedValue({ serviceId: 'service-id', roles: [{ id: 'role1' }] });
    getSingleServiceForUser.mockResolvedValue({ id: "testService1", roles: [{ id: 'role1' }], name: "applicationName" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update user services', async () => {
    checkIfRolesChanged.mockResolvedValue(false);

    await postManageConsoleRoles(req, res);

    expect(getServiceById).toHaveBeenCalled();
    expect(updateUserService).toHaveBeenCalledTimes(1);
    expect(updateUserService).toHaveBeenCalledWith(
      'userId',
      'testService1',
      'departmentForEducation1',
      ['role1', 'role2'],
      'correlationId'
    );
  });

  it('should redirect the user to the manage console services endpoint with a flash message', async () => {
    await postManageConsoleRoles(req, res);

    expect(res.flash).toHaveBeenCalledWith('info', ["Roles updated", "The selected roles have been updated for Test Service"]);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith('/users/userId/manage-console-services');
  });
});




// jest.mock('login.dfe.jwt-strategies');
// jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
//   support: {
//     type: 'api',
//     service: {
//       url: 'http://support.test',
//     },
//   },
//   access: {
//     identifiers: {
//       service: "service1",
//       organisation: "organisation1",
//       departmentForEducation: "departmentForEducation1"
//     }
//   }
// }));

// jest.mock('login.dfe.policy-engine');

// const jwtStrategy = require('login.dfe.jwt-strategies');
// jest.mock('login.dfe.jwt-strategies');

// const postManageConsoleRoles = require('./../../../src/app/users/postManageConsoleRoles');
// const { getServiceById } = require('./../../../src/infrastructure/applications');
// const { getSingleUserService, listRolesOfService } = require('./../../../src/infrastructure/access');

// const {
//   getSingleServiceForUser,
//   checkIfRolesChanged
// } = require('./../../../src/app/users/getManageConsoleRoles');

// jest.mock('./../../../src/app/users/getManageConsoleRoles');

// jest.mock('./../../../src/infrastructure/applications', () => ({
//   getServiceById: jest.fn(),
// }));

// jest.mock('./../../../src/app/users/utils', () => ({
//   getUserDetails: jest.fn(),
// }));

// jest.mock('./../../../src/infrastructure/access', () => ({
//   listRolesOfService: jest.fn(),
//   getSingleUserService: jest.fn(),
//   getSingleInvitationService: jest.fn(),
//   updateUserService: jest.fn(),
// }));

// const { updateUserService } = require('./../../../src/infrastructure/access');

// describe('when changing a users manage console access', () => {

//   // COMMON ARRANGE
//   beforeEach(() => {
//     jwtStrategy.mockReset();
//     jwtStrategy.mockImplementation(() => {
//       return {
//         getBearerToken: jest.fn().mockReturnValue('token'),
//       };
//     });

//     req = {
//       id: 'correlationId',
//       csrfToken: () => 'token',
//       accepts: () => ['text/html'],
//       user: {
//         sub: 'user1',
//         email: 'super.user@unit.test',
//       },
//       body: {
//         role: ['role1', 'role2']
//       },
//       params: {
//         uid: 'userId',
//         sid: 'testService1'
//       },
//       session: {},
//     };

//     res = {
//       render: jest.fn(),
//       flash: jest.fn(),
//       redirect: jest.fn(),
//     };

//     listRolesOfService.mockResolvedValue([
//       {
//         id: 'role1',
//         name: 'test service 1 - Service Access Management',
//         code: 'testService1_accessManage',
//         numericId: '23173',
//         status: { id: 1 }
//       },
//       {
//         id: 'role2',
//         name: 'test service 1 - Service Banner',
//         code: 'testService1_serviceBanner',
//         numericId: '23175',
//         status: { id: 1 }
//       },
//       {
//         id: 'role3',
//         name: 'test service 1 - Service Configuration',
//         code: 'testService1_serviceconfig',
//         numericId: '23172',
//         status: { id: 1 }
//       },
//       {
//         id: 'role4',
//         name: 'test service 2 - Service Support',
//         code: 'testService1_serviceSup',
//         numericId: '23174',
//         status: { id: 1 }
//       }
//     ])

//     getServiceById.mockResolvedValue({ name: 'Test Service', id: 'testService1' });
//     getSingleUserService.mockResolvedValue({ serviceId: 'service-id', roles: [{ id: 'role1' }] });
//     getSingleServiceForUser.mockResolvedValue({ id: "testService1", roles: [{ id: 'role1' }], name: "applicationName" });

//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should successfully update users services', async () => {

//     // ARRANGE
//     checkIfRolesChanged.mockResolvedValue(false);

//     // ACT
//     await postManageConsoleRoles(req, res);

//     // ASSERT
//     expect(getServiceById).toHaveBeenCalled();
//     expect(updateUserService.mock.calls).toHaveLength(1);
//     expect(updateUserService.mock.calls[0][0]).toBe('userId');
//     expect(updateUserService.mock.calls[0][1]).toBe('testService1');
//     expect(updateUserService.mock.calls[0][2]).toBe('departmentForEducation1');
//     expect(updateUserService.mock.calls[0][3]).toStrictEqual(['role1', 'role2']);
//     expect(updateUserService.mock.calls[0][4]).toBe('correlationId');

//   });

//   it('should then redirect the user to the manage console services endpoint with a flash message', async () => {

//     // ACT
//     await postManageConsoleRoles(req, res);

//     // ASSERT
//     expect(res.flash.mock.calls[0][1]).toEqual(["Roles updated", "The selected roles have been updated for Test Service"]);
//     expect(res.redirect.mock.calls).toHaveLength(1);
//     expect(res.redirect.mock.calls[0][0]).toBe('/users/userId/manage-console-services');
//   });
// });