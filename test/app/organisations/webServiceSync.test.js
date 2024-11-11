jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('login.dfe.jobs-client');
jest.mock('../../../src/app/organisations/wsSynchFunCall')

const { getRequestMock, getResponseMock } = require('./../../utils');
const { sendResult } = require('./../../../src/infrastructure/utils');
const { getOrganisationByIdV2 } = require('./../../../src/infrastructure/organisations');
const { ServiceNotificationsClient } = require('login.dfe.jobs-client');
const webServiceSync = require('./../../../src/app/organisations/webServiceSync');

const res = getResponseMock();
const orgResult = { id: 'org-1', name: 'organisation one' };
const serviceNotificationsClient = {
  notifyOrganisationUpdated: jest.fn(),
};

describe('when syncing organisation for sync', function () {
  let req;

  beforeEach(() => {
    getOrganisationByIdV2.mockReset().mockReturnValue(orgResult);

    serviceNotificationsClient.notifyOrganisationUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(() => serviceNotificationsClient);

    req = getRequestMock({
      params: {
        id: 'org-1',
      },
    });
    res.mockResetAll();
  });

  it('then it should prompt for confirmation with organisation details', async () => {
    await webServiceSync.get(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(req, res, 'organisations/views/webServiceSync', {
      csrfToken: req.csrfToken(),
      organisation: orgResult,
    });
  });

  // Functionality removed as part of feature/PIM-2461 - PR #426

/*  it('then it should queue organisation for sync on confirmation', async () => {
    await webServiceSync.post(req, res);

    expect(serviceNotificationsClient.notifyOrganisationUpdated).toHaveBeenCalledTimes(1);
    expect(serviceNotificationsClient.notifyOrganisationUpdated).toHaveBeenCalledWith(orgResult);
  });

  it('then it should add flash message that organisation has been queued on confirmation', async () => {
    await webServiceSync.post(req, res);

    expect(res.flash).toHaveBeenCalledTimes(1);
    expect(res.flash).toHaveBeenCalledWith('info', 'Organisation has been queued for sync');
  });
  */

  it('then it should redirect to organisation details page on confirmation', async () => {
    await webServiceSync.post(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith('/organisations/org-1/users');
  });
});