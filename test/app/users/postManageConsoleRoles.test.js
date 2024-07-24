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
  
  describe('updateUserService', () => {

  })