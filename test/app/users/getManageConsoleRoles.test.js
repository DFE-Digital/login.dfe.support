const { 
    getSingleServiceForUser, 
    addOrChangeManageConsoleServiceTitle, 
    checkIfRolesChanged 
  } = require('./../../../src/app/users/getManageConsoleRoles');
  
  jest.mock('./../../../src/infrastructure/utils', () => ({
    sendResult: jest.fn(),
  }));
  
  jest.mock('./../../../src/app/users/utils', () => ({
    getUserDetails: jest.fn(),
  }));
  
  jest.mock('./../../../src/infrastructure/applications', () => ({
    getServiceById: jest.fn(),
  }));
  
  jest.mock('./../../../src/infrastructure/access', () => ({
    listRolesOfService: jest.fn(),
    getSingleUserService: jest.fn(),
    getSingleInvitationService: jest.fn(),
    updateUserService: jest.fn(),
  }));
  
  describe('getSingleServiceForUser', () => {
    it('should return service details for a user', async () => {
      const { getServiceById } = require('./../../../src/infrastructure/applications');
      const { getSingleUserService } = require('./../../../src/infrastructure/access');
      
      getServiceById.mockResolvedValue({ name: 'Test Service' });
      getSingleUserService.mockResolvedValue({ serviceId: 'service-id', roles: ['role1'] });
      
      const result = await getSingleServiceForUser('user-id', 'org-id', 'service-id', 'correlation-id');
      
      expect(result).toEqual({
        id: 'service-id',
        roles: ['role1'],
        name: 'Test Service'
      });
    });
  
    it('should return service details for an invitation user', async () => {
      const { getServiceById } = require('./../../../src/infrastructure/applications');
      const { getSingleInvitationService } = require('./../../../src/infrastructure/access');
      
      getServiceById.mockResolvedValue({ name: 'Test Service' });
      getSingleInvitationService.mockResolvedValue({ serviceId: 'service-id', roles: ['role1'] });
      
      const result = await getSingleServiceForUser('inv-user-id', 'org-id', 'service-id', 'correlation-id');
      
      expect(result).toEqual({
        id: 'service-id',
        roles: ['role1'],
        name: 'Test Service'
      });
    });
  });
  
  describe('addOrChangeManageConsoleServiceTitle', () => {
    it('should return true if user has a manage console role', () => {
      const userManageRoles = { roles: [{ id: 'role1' }, { id: 'role2' }] };
      const manageConsoleRoleIds = ['role1', 'role3'];
      
      const result = addOrChangeManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds);
      
      expect(result).toBe(true);
    });
  
    it('should return false if user does not have a manage console role', () => {
      const userManageRoles = { roles: [{ id: 'role1' }, { id: 'role2' }] };
      const manageConsoleRoleIds = ['role3', 'role4'];
      
      const result = addOrChangeManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds);
      
      expect(result).toBe(false);
    });
  });
  
  describe('checkIfRolesChanged', () => {
    it('should return true if roles have not changed', () => {
      const rolesSelectedBeforeSession = ['role1', 'role2'];
      const newRolesSelected = ['role1', 'role2'];
      
      const result = checkIfRolesChanged(rolesSelectedBeforeSession, newRolesSelected);
      
      expect(result).toBe(true);
    });
  
    it('should return false if roles have changed', () => {
      const rolesSelectedBeforeSession = ['role1', 'role2'];
      const newRolesSelected = ['role1', 'role3'];
      
      const result = checkIfRolesChanged(rolesSelectedBeforeSession, newRolesSelected);
      
      expect(result).toBe(false);
    });
  });





// jest.mock('./../../../src/infrastructure/config', () =>
//     require('./../../utils').configMockFactory());
// jest.mock('./../../../src/app/users/utils');
// jest.mock('./../../../src/infrastructure/access');
// jest.mock('./../../../src/infrastructure/utils');
// jest.mock('./../../../src/infrastructure/applications');

// // const getManageConsoleRolesFile = require('./../../../src/app/users/getManageConsoleRoles')

// // getManageConsoleRolesFile.getSingleServiceForUser = jest.fn().mockReturnValue({
// //     id:'B1F190AA-729A-45FC-A695-4EA209DC79D4',
// //     roles:['role1', 'role2', 'role3'],
// //     name: 'manage'
// // })


        
// const {getManageConsoleRoles, getSingleServiceForUser} = require('./../../../src/app/users/getManageConsoleRoles');
// const { listRolesOfService, getSingleUserService,  getSingleInvitationService, updateUserService } = require('./../../../src/infrastructure/access');
// const { getServiceById } = require('./../../../src/infrastructure/applications')

// jest.mock('./../../../src/app/users/getManageConsoleRoles', () => {
//     const originalMod = jest.requireActual('./../../../src/app/users/getManageConsoleRoles');
//     return {
//             ...originalMod,
//             getSingleServiceForUser: jest.fn(),
//         }
//     })

// const { sendResult } = require('./../../../src/infrastructure/utils');
// const { getUserDetails } = require('./../../../src/app/users/utils');



// describe('getManageConsoleRoles', () => {
//     let req;
//     let res;

//     beforeEach(() => {
//         req = {
//             id: 'correlationId',
//             csrfToken: () => 'token',
//             accepts: () => ['text/html'],
//             user: {
//                 sub: 'user1',
//                 email: 'super.user@unit.test',
//         },
//         params: {
//             uid: 'user1',
//             sid: 'serviceSelectedByUserId'
//         },
//         session: {},
//         };

//         res = {
//             render: jest.fn(),
//         };

//         getServiceById.mockReset()
//         getServiceById.mockReturnValueOnce({
//             // id: 'B1F190AA-729A-45FC-A695-4EA209DC79D4'
//             id: 'manage'
//             }).mockReturnValueOnce({
//             name:'gias',
//             id: 'serviceSelectedByUserId',
//             }).mockReturnValue({
//                 // coming through in getSingleServiceForUser/getServiceById call
//                 name:'manage',
//             });

//         getUserDetails.mockReset()
//         getUserDetails.mockReturnValue({
//         // test to check not empty for name ? 
//             id: 'user1',
//             name:'Bill Murray'
//             });

//         getSingleServiceForUser.mockReset()
//         getSingleServiceForUser.mockReturnValue({
//                 id:'B1F190AA-729A-45FC-A695-4EA209DC79D4',
//                 roles:['role1', 'role2', 'role3'],
//             });
            
//         getSingleUserService.mockReset()
//         getSingleUserService.mockReturnValueOnce(() => ({
//             id:'B1F190AA-729A-45FC-A695-4EA209DC79D4',
//             roles:['role1', 'role2', 'role3'],
//             name: 'manage',
            
//         }));

//         // getSingleInvitationService.mockReset()
//         // getSingleInvitationService.mockReturnValue(() => ({
//         //     id:'B1F190AA-729A-45FC-A695-4EA209DC79D4',
//         //     roles:['role1', 'role2', 'role3'],
//         //     name: 'manage',
            
//         // }));

//         listRolesOfService.mockReset()
//         listRolesOfService.mockReturnValue([{
//             //! check this output 
//             // id:'serviceSelectedByUserId',
//             code:'serviceSelectedByUserId_roleId1'
//         }]);
        
//         // addOrChangeManageConsoleServiceTitle.mockReset()
//         // addOrChangeManageConsoleServiceTitle.mockReturnValue(true);

//     })

//     it('should call getServiceById', async () => {
//         // check?
//         // await getManageConsoleRoles(req, res);
//         await getManageConsoleRoles(req, res);

//         // getSingleServiceForUser.mockReturnedValue(() => ({
//         //     id:'B1F190AA-729A-45FC-A695-4EA209DC79D4',
//         //     roles:['role1', 'role2', 'role3'],
//         //     name: 'manage',
            
//         // }));

//         expect(getServiceById).toHaveBeenCalled();
//         // expect(sendResult).toHaveBeenCalled();
//         // expect (sendResult.mock.calls[0][3]).objectContaining(user, services)
//     })

// })