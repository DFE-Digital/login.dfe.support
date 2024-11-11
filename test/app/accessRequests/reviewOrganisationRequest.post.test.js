jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/accessRequests/utils');
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/search');
jest.mock('login.dfe.jobs-client');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { post } = require('./../../../src/app/accessRequests/reviewOrganisationRequest');

const res = getResponseMock();
const { putUserInOrganisation, updateRequestById, getOrganisationById } = require('./../../../src/infrastructure/organisations');
const { getSearchDetailsForUserById, updateIndex } = require('./../../../src/infrastructure/search');
const { getAndMapOrgRequest } = require('./../../../src/app/accessRequests/utils');
const logger = require('./../../../src/infrastructure/logger');
const { NotificationClient } = require('login.dfe.jobs-client');

const sendAccessRequest = jest.fn();
NotificationClient.mockImplementation(() => ({
  sendAccessRequest
}));

Date.now = jest.fn(() => '2019-01-02');

describe('when reviewing an organisation request', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      user: {
        sub: 'user1',
        email: 'email@email.com',
      },
      params: {
        orgId: 'org1',
      },
      body: {
        selectedResponse: 'approve',
      },
    });

    logger.audit.mockReset();
    putUserInOrganisation.mockReset();
    updateRequestById.mockReset();

    sendAccessRequest.mockReset();
    NotificationClient.mockImplementation(() => ({
      sendAccessRequest,
    }));

    getOrganisationById.mockReset();
    getOrganisationById.mockReturnValue({
      id: 'org1',
      name: 'organisation two',
      category: {
        id: '001',
        name: 'Establishment',
      },
      status: {
        id: 1,
      },
    });

    getSearchDetailsForUserById.mockReset();
    getSearchDetailsForUserById.mockReturnValue({
      organisations: [],
    });

    getAndMapOrgRequest.mockReset();
    getAndMapOrgRequest.mockReturnValue({
      usersName: 'John Doe',
      usersEmail: 'john.doe@email.com',
      id: 'requestId',
      org_id: 'org1',
      org_name: 'Org 1',
      user_id: 'userId',
      created_date: '2019-05-01',
      actioned_date: null,
      actioned_by: null,
      actioned_reason: null,
      reason: '',
      status: {
        id: 0,
        name: 'Pending',
      },
    });
    res.mockResetAll();
  });

  it('then it should render error if no response selected', async () => {
    req.body.selectedResponse = null;

    await post(req, res);

    expect(putUserInOrganisation.mock.calls).toHaveLength(0);
    expect(updateRequestById.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('accessRequests/views/reviewOrganisationRequest');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: '/access-requests',
      csrfToken: 'token',
      request: {
        actioned_by: null,
        actioned_date: null,
        actioned_reason: null,
        created_date: '2019-05-01',
        id: 'requestId',
        org_id: 'org1',
        org_name: 'Org 1',
        reason: '',
        status: {
          id: 0,
          name: 'Pending',
        },
        user_id: 'userId',
        usersEmail: 'john.doe@email.com',
        usersName: 'John Doe',
      },
      selectedResponse: null,
      title: 'Review request - DfE Sign-in',
      validationMessages: {
        selectedResponse: 'Approve or Reject must be selected',
      },
    });
  });

  it('then it should render error if request already actioned', async () => {
    getAndMapOrgRequest.mockReset().mockReturnValue({
      usersName: 'John Doe',
      usersEmail: 'john.doe@email.com',
      approverName: 'Jane Doe',
      approverEmail: 'jane.doe@email.com',
      id: 'requestId',
      org_id: 'org1',
      org_name: 'Org 1',
      user_id: 'userId',
      created_date: '2019-05-01',
      actioned_date: null,
      actioned_by: 'jane.doe@email.com',
      actioned_reason: null,
      reason: '',
      status: {
        id: 1,
        name: 'approved',
      },
    });

    await post(req, res);

    expect(putUserInOrganisation.mock.calls).toHaveLength(0);
    expect(updateRequestById.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('accessRequests/views/reviewOrganisationRequest');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: '/access-requests',
      csrfToken: 'token',
      request: {
        actioned_by: 'jane.doe@email.com',
        actioned_date: null,
        actioned_reason: null,
        created_date: '2019-05-01',
        id: 'requestId',
        org_id: 'org1',
        org_name: 'Org 1',
        reason: '',
        status: {
          id: 1,
          name: 'approved',
        },
        user_id: 'userId',
        usersEmail: 'john.doe@email.com',
        usersName: 'John Doe',
        approverName: 'Jane Doe',
        approverEmail: 'jane.doe@email.com',
      },
      selectedResponse: 'approve',
      title: 'Review request - DfE Sign-in',
      validationMessages: {
        selectedResponse: 'Request already actioned by jane.doe@email.com'
      },
    });
  });

  it('then it should redirect to select permission level if approved', async () => {
    req.body.selectedResponse = 'approve';

    await post(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('approve');
  });

  it('then it should redirect to rejection reason if reject', async () => {
    req.body.selectedResponse = 'reject';

    await post(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('reject');
  });
});
