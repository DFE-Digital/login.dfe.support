// jest.mock('./../../../src/infrastructure/config', () =>
//     require('./../../utils').configMockFactory());
// jest.mock('./../../../src/infrastructure/utils');
// jest.mock('./../../../src/infrastructure/applications');
// jest.mock('./../../../src/app/users/utils');

// const getManageConsoleServices = require('./../../../src/app/users/getManageConsoleServices')

// const { sendResult } = require('./../../../src/infrastructure/utils');
// const {
// getAllServices,
// } = require('./../../../src/infrastructure/applications');

// const { getUserDetails } = require('./../../../src/app/users/utils');

// describe('getManageConsoleServices', () => {
//     let req;
//     let res;

//     beforeEach(() => {
//         req = {
//             id: 'correlationId',
//             csrfToken: () => 'token',
//             accepts: () => ['text/html'],
//             user: {
//             sub: 'user1',
//             email: 'super.user@unit.test',
//         },
//         params: {
//             uid: 'user1',
//         },
//         session: {},
//     };

//     res = {
//         render: jest.fn(),
//     };

//     getUserDetails.mockReset();
//     getUserDetails.mockReturnValue({
//         id: 'user1',
//     });

//       //! invitation ?? doesn't have isIdOnlyService, isHiddenService
//     getAllServices.mockReset();
//     getAllServices.mockReturnValue([
//     {
//         id: '49FFFA46-BB7A-439A-B7A1-7CA00FF77456',
//         name: 'Academy Budget Forecast Return',
//         description:
//         'This service is for Academy trusts to submit their budget forecasts to the Education and Skills Funding Agency',
//         isExternalService: true,
//         isIdOnlyService: false,
//         isHiddenService: false,
//         isMigrated: false,
//         relyingParty: {},
//     }
//     ]);
// });

//     it('should call getUserDetails', async () => {
//         await getManageConsoleServices(req, res);

//         expect(getUserDetails).toHaveBeenCalled()
//         expect(getUserDetails).not.toBeFalsy();
//         expect(getUserDetails.mock.calls[0]).toHaveLength(1);
//         expect(sendResult.mock.calls[0][3].user).toMatchObject({
//         id: 'user1',
//         });
//     });
    
//     it('should call getAllServices', async () => {
//         await getManageConsoleServices(req, res);
        
//         expect(getAllServices).toHaveBeenCalled();
//         expect(getAllServices).toReturnWith([
//         {
//             id: '49FFFA46-BB7A-439A-B7A1-7CA00FF77456',
//             name: 'Academy Budget Forecast Return',
//             description:
//             'This service is for Academy trusts to submit their budget forecasts to the Education and Skills Funding Agency',
//             isExternalService: true,
//             isIdOnlyService: false,
//             isHiddenService: false,
//             isMigrated: false,
//             relyingParty: {},
//         }
//         ]);
//         expect(getAllServices()).toHaveLength(1);
//         expect(getUserDetails).not.toBeFalsy();
//         expect(getAllServices().length).toBe(1);
//         expect(getAllServices()[0].id).toBe('49FFFA46-BB7A-439A-B7A1-7CA00FF77456');
//         expect(sendResult.mock.calls[0][3].user).toMatchObject({
//             id: 'user1',
//         });
//     });

//     it('should call sendResult', async () => {
//         await getManageConsoleServices(req, res);

//         expect(sendResult).toHaveBeenCalled();
//         expect(sendResult.mock.calls[0][3].user).toMatchObject({
//             id: 'user1',
//         });
//         //expect (sendResult.mock.calls[0][3]).objectContaining(user, services)
//     })
// });
  
  


// jest.mock('./../../../src/infrastructure/config', () =>
//     require('./../../utils').configMockFactory());
// jest.mock('./../../../src/infrastructure/utils');
// jest.mock('./../../../src/infrastructure/applications');
// jest.mock('./../../../src/app/users/utils');

// const getManageConsoleServices = require('./../../../src/app/users/getManageConsoleServices')

// const { sendResult } = require('./../../../src/infrastructure/utils');
// const {
// getAllServices,
// } = require('./../../../src/infrastructure/applications');

// const { getUserDetails } = require('./../../../src/app/users/utils');


const sinon = require('sinon');
const { sendResult } = require('./../../../src/infrastructure/utils');
const { getAllServices } = require('./../../../src/infrastructure/applications');
const { getUserDetails } = require('./../../../src/app/users/utils');
const getManageConsoleServices = require('./../../../src/app/users/getManageConsoleServices');

describe('getManageConsoleServices', () => {
  let req, res, user, services;

  beforeEach(() => {
    req = {
      csrfToken: sinon.stub().returns('testCsrfToken'),
      params: {
        id: '12345'
      }
    };
    res = {
      render: sinon.stub(),
      status: sinon.stub().returnsThis(),
      send: sinon.stub()
    };
    user = { id: 'user123' };
    services = [{ id: 'service1' }, { id: 'service2' }];

    sinon.stub(getUserDetails, 'default').resolves(user);
    sinon.stub(getAllServices, 'default').resolves(services);
    sinon.stub(sendResult, 'default').callsFake((req, res, view, options) => {
      res.render(view, options);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should get user details and all services, then send result with correct parameters', async () => {
    await getManageConsoleServices(req, res);

    expect(getUserDetails.default.calledOnceWith(req)).toBeTruthy();
    expect(getAllServices.default.calledOnce).toBeTruthy();

    expect(sendResult.default.calledOnce).toBeTruthy();
    const [calledReq, calledRes, view, options] = sendResult.default.getCall(0).args;
    expect(calledReq).toBe(req);
    expect(calledRes).toBe(res);
    expect(view).toBe('users/views/selectManageConsoleService');
    expect(options).toEqual({
      layout: 'sharedViews/layoutNew.ejs',
      csrfToken: 'testCsrfToken',
      backLink: `/users/${user.id}/organisations`,
      user,
      services
    });
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Test error');
    getUserDetails.default.rejects(error);

    await getManageConsoleServices(req, res);

    expect(res.status.calledOnceWith(500)).toBeTruthy();
    expect(res.send.calledOnceWith({ error: 'An error occurred' })).toBeTruthy();
  });
});
