const sinon = require('sinon');
const { sendResult } = require('./../../../src/infrastructure/utils');
const { getAllServices } = require('./../../../src/infrastructure/applications');
const { getUserDetails } = require('./../../../src/app/users/utils');
const getManageConsoleServices = require('./../../../src/app/users/getManageConsoleServices');

jest.mock('./../../../src/infrastructure/config', () =>
  require('./../../utils').configMockFactory());

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
    manageConsoleServices = [{ id: 'manageService1' }, { id: 'manageService2' }];

    sinon.stub(getUserDetails, 'default').resolves(user);
    sinon.stub(getAllServices, 'default').resolves(services);
    sinon.stub(getManageConsoleServices).resolves(manageConsoleServices);

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
