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
      departmentForEducation: "departmentForEducation1",
      manageServiceIdentifiers: "manageServiceIdentifiers1"
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
  getUserDetailsById: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/access', () => ({
  listRolesOfService: jest.fn(),
  getSingleUserService: jest.fn(),
  getSingleInvitationService: jest.fn(),
  updateUserService: jest.fn(),
  addUserService: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/organisations', () => ({
  putUserInOrganisation: jest.fn(),
}));

// Import dependencies
const jwtStrategy = require('login.dfe.jwt-strategies');
const postManageConsoleRoles = require('./../../../src/app/users/postManageConsoleRoles');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const { putUserInOrganisation } = require('./../../../src/infrastructure/organisations');
const { getSingleUserService, listRolesOfService, updateUserService, addUserService } = require('./../../../src/infrastructure/access');
const { getUserDetails } = require('./../../../src/app/users/utils');
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
    getUserDetails.mockResolvedValue({
      hasManageAccess: true,
    });

    await postManageConsoleRoles(req, res);

    expect(updateUserService).toHaveBeenCalledTimes(1);
    expect(updateUserService).toHaveBeenCalledWith(
      'userId',
      'manageServiceIdentifiers1', 
      'departmentForEducation1',
      ['role1', 'role2'],
      'correlationId'
    );
  });

  it('should redirect the user to the manage console services endpoint with a flash message if updating the service', async () => {
    getUserDetails.mockResolvedValue({
      hasManageAccess: true,
    });

    await postManageConsoleRoles(req, res);

    expect(updateUserService).toHaveBeenCalledTimes(1);
    expect(res.flash).toHaveBeenCalledWith('info', ["Roles updated", "The selected roles have been updated for Test Service"]);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith('/users/userId/manage-console-services');
  });

  it('should redirect the user to the manage console services endpoint with a flash message if adding the service', async () => {
    getUserDetails.mockResolvedValue({
      hasManageAccess: false,
    });

    await postManageConsoleRoles(req, res);

    expect(addUserService).toHaveBeenCalledTimes(1);
    expect(res.flash).toHaveBeenCalledWith('info', ["Roles updated", "The selected roles have been updated for Test Service"]);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith('/users/userId/manage-console-services');
  });

  it('should call addUserService if hasManageAccess is false', async () => {
    checkIfRolesChanged.mockResolvedValue(false);
    getUserDetails.mockResolvedValue({
      hasManageAccess: false,
    });

    await postManageConsoleRoles(req, res);

    expect(putUserInOrganisation).toHaveBeenCalledTimes(1);
    expect(addUserService).toHaveBeenCalledTimes(1);
    expect(updateUserService).not.toHaveBeenCalled()
    expect(addUserService).toHaveBeenCalledWith(
      'userId',
      'manageServiceIdentifiers1',
      'departmentForEducation1',
      ['role1', 'role2'],
      'correlationId'
    );
  });
});

