jest.mock('./../../../src/infrastructure/config', () =>
  require('./../../utils').configMockFactory()
);
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/infrastructure/applications');
jest.mock('./../../../src/app/users/utils');


const getManageConsoleServices = require('./../../../src/app/users/getManageConsoleServices')

const { sendResult } = require('./../../../src/infrastructure/utils');
const {
  getAllServices,
} = require('./../../../src/infrastructure/applications');

const { getUserDetails } = require('./../../../src/app/users/utils');

//? test that user and services are being passed through
//? what needs to be mocked?
// req passed into getUserDetails, as long as the dummy request obj has the required fields?
// mock return for const user = await getUserDetails(req);
// getUserDetails calls getUserDetailsById, needs req.params.uid, req.id

// ejs view uses:
// user.name, user.email, user.lastLogin, user.status.description, user.loginsInPast12Months.successful

// const services = await getAllServices();
// services.services[i].id
// services.services[i].name
// services.services[i].isIdOnlyService
// services.services[i].isHiddenService

//? only mock/test for these aspects?

//? sendResult not necessary ??

describe('getManageConsoleServices', () => {
  let req;
  let res;

  beforeEach(() => {
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
      },
      session: {},
    };

    res = {
      render: jest.fn(),
    };

    getUserDetails.mockReset();
    //* the object returned doesn't have to be a replica of the actual return value?
    getUserDetails.mockReturnValue({
      id: 'user1',
    });

    //! invitation ?? doesn't have isIdOnlyService, isHiddenService
    getAllServices.mockReset();
    getAllServices.mockReturnValue([
      {
        id: '49FFFA46-BB7A-439A-B7A1-7CA00FF77456',
        name: 'Academy Budget Forecast Return',
        description:
          'This service is for Academy trusts to submit their budget forecasts to the Education and Skills Funding Agency',
        isExternalService: true,
        isIdOnlyService: false,
        isHiddenService: false,
        isMigrated: false,
        relyingParty: {},
      }
    ]);
  });

  it('should get user details', async () => {
    await getManageConsoleServices(req, res);
  
    expect(getUserDetails).toHaveBeenCalled()
    expect(getUserDetails).not.toBeFalsy();
    expect(getUserDetails.mock.calls[0]).toHaveLength(1);
    expect(sendResult.mock.calls[0][3].user).toMatchObject({
      id: 'user1',
    });
  });
  
  it('then should get all services', async () => {
    await getManageConsoleServices(req, res);
    
    expect(getAllServices).toHaveBeenCalled()
    //? mock.calls looking at the args passed into the function? 
    // expect(getAllServices.mock.calls[0][1]).toHaveLength(2);
    expect(getAllServices).toReturnWith([
      {
        id: '49FFFA46-BB7A-439A-B7A1-7CA00FF77456',
        name: 'Academy Budget Forecast Return',
        description:
        'This service is for Academy trusts to submit their budget forecasts to the Education and Skills Funding Agency',
        isExternalService: true,
        isIdOnlyService: false,
        isHiddenService: false,
        isMigrated: false,
        relyingParty: {},
      }
    ]);
    expect(getAllServices()).toHaveLength(1);
    expect(getUserDetails).not.toBeFalsy();
    expect(getAllServices().length).toBe(1);
    expect(getAllServices()[0].id).toBe('49FFFA46-BB7A-439A-B7A1-7CA00FF77456');
    expect(sendResult.mock.calls[0][3].user).toMatchObject({
      id: 'user1',
    });
  });

});

