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

jest.mock('./../../../src/infrastructure/access', () => ({
    listRolesOfService: jest.fn(),
    getSingleUserService: jest.fn(),
    getSingleInvitationService: jest.fn(),
    updateUserService: jest.fn(),
  }));

jest.mock('request-promise');
jest.mock('login.dfe.jwt-strategies');
 
const { updateUserService } = require('./../../../src/infrastructure/access');

describe('updateUserService', () => {
  let getBearerTokenMock;
 
  beforeEach(() => {
    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });
 
  afterEach(() => {
    jest.clearAllMocks();
  });
 
  it('should successfully update user service', async () => {
    const response = { success: true };
    const result = await updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId');
    
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
 
  it('should return false for 403 status code', async () => {
    const token = 'mockToken';
    const error = new Error('Forbidden');
    error.statusCode = 403;
    getBearerTokenMock.mockResolvedValue(token);
    rp.mockRejectedValue(error);
 
    const result = await updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId');
    expect(result).toBe(false);
    expect(getBearerTokenMock).toHaveBeenCalledTimes(1);
    expect(rp).toHaveBeenCalledTimes(1);
  });
 
  it('should return false for 409 status code', async () => {
    const token = 'mockToken';
    const error = new Error('Conflict');
    error.statusCode = 409;
    getBearerTokenMock.mockResolvedValue(token);
    rp.mockRejectedValue(error);
 
    const result = await updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId');
    expect(result).toBe(false);
    expect(getBearerTokenMock).toHaveBeenCalledTimes(1);
    expect(rp).toHaveBeenCalledTimes(1);
  });
 
  it('should throw error for other status codes', async () => {
    //const token = 'mockToken';
    const error = new Error('Internal Server Error');
    error.statusCode = 500;
    //getBearerTokenMock.mockResolvedValue(token);
    rp.mockRejectedValue(error);
 
    await expect(updateUserService('userId', 'serviceId', 'organisationId', ['role1', 'role2'], 'correlationId')).rejects.toThrow(error);
    expect(getBearerTokenMock).toHaveBeenCalledTimes(1);
    expect(rp).toHaveBeenCalledTimes(1);
  });
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