jest.mock('./../../../src/infrastructure/config', () =>
    require('./../../utils').configMockFactory());
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/infrastructure/applications');
jest.mock('./../../../src/app/users/getManageConsoleRoles')

const {getManageConsoleRoles, getSingleServiceForUser} = require('./../../../src/app/users/getManageConsoleRoles')
const { sendResult } = require('./../../../src/infrastructure/utils');
const { getUserDetails } = require('./../../../src/app/users/utils');
const { getServiceById } = require('./../../../src/infrastructure/applications')
const { listRolesOfService, getSingleUserService, getSingleInvitationService, updateUserService } = require('./../../../src/infrastructure/access');

describe('getManageConsoleRoles', () => {
    let req;
    let res;

    //? beforeEach req/res
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
            sid: 'serviceSelectedByUserId'
            },
        session: {},
        };

    res = {
        render: jest.fn(),
    };

    //!  mock twice?
    // get manage details - id 
    getServiceById.mockReset()
    getServiceById.mockReturnValue({
        id: 'B1F190AA-729A-45FC-A695-4EA209DC79D4'
    });
    
    // get the user selected service using uid from params
    getServiceById.mockReset()
    getServiceById.mockReturnValue({
        name:'service1',
        id: 'serviceSelectedByUserId',
    });

    getUserDetails.mockReset()
    getUserDetails.mockReturnValue({
    // test to check not empty for name ? 
        id: 'user1',
        name:'Bill Murray'
    });

    //! 
    getSingleServiceForUser.mockReset()
    getSingleServiceForUser.mockReturnValue({
        id:'B1F190AA-729A-45FC-A695-4EA209DC79D4',
        roles:['role1', 'role2', 'role3'],
        name: 'manage'
    });
    
    // listRolesOfService is filtered by manage service id to get the manage roles
    listRolesOfService.mockReset()
    listRolesOfService.mockReturnValue({
        //! check this output 
        code:'service1_roleId1'
    });
    //? mock reset each supporting function / mock return value?
    //* const manage = await getServiceById('manage');
    //* const user = await getUserDetails(req);
    //* const serviceSelectedByUser = await getServiceById(req.params.sid);
    //* const userManageRoles = await getSingleServiceForUser(req.params.uid, '3de9d503-6609-4239-ba55-14f8ebd69f56', manage.id, req.id);
    //* const manageConsoleRolesForAllServices = await listRolesOfService(manage.id);
    
    // const manageConsoleRolesForSelectedService = manageConsoleRolesForAllServices.filter(service => service.code.split('_')[0] === req.params.sid);
    // let manageConsoleRoleIds = [];
    // manageConsoleRolesForSelectedService.forEach(obj => manageConsoleRoleIds.push(obj.id));
    // const addOrChangeService = await addOrChangeManageConsoleServiceTitle(userManageRoles, manageConsoleRoleIds);
    // sendResult

    it('should get the manage console service details', async () => {
        await getManageConsoleRoles(req, res);
        // await getSingleServiceForUser()

        expect(getServiceById).toHaveBeenCalled()
    })

    // it('should get user details', async () => {
    //     await getManageConsoleServices(req, res);
      
    //     expect(getUserDetails).toHaveBeenCalled()
    //     expect(getUserDetails.mock.calls[0]).toHaveLength(1);
    //     expect(sendResult.mock.calls[0][3].user).toMatchObject({
    //       id: 'user1',
    //     });
    //   });

})