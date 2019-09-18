jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/app/accessRequests/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('login.dfe.notifications.client');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { post } = require('./../../../src/app/accessRequests/rejectOrganisationRequest');
const res = getResponseMock();
const { updateRequestById } = require('./../../../src/infrastructure/organisations');
const { getAndMapOrgRequest } = require('./../../../src/app/accessRequests/utils');
const logger = require('./../../../src/infrastructure/logger');

const NotificationClient = require('login.dfe.notifications.client');
const sendAccessRequest = jest.fn();
NotificationClient.mockImplementation(() => {
  return {
    sendAccessRequest
  };
});

Date.now = jest.fn(() => '2019-01-02');

const createString = (length) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  let str = '';
  for (let i = 0; i < length; i += 1) {
    str = str + charset[Math.random() * charset.length];
  }
  return str;
};

describe('when rejecting an organisation request', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      user: {
        sub: 'user1',
        email: 'email@email.com'
      },
      params: {
        orgId: 'org1'
      },
      body: {
        reason: 'reason for rejection'
      },
    });
    updateRequestById.mockReset();

    sendAccessRequest.mockReset();
    NotificationClient.mockImplementation(() => {
      return {
        sendAccessRequest,
      };
    });
    getAndMapOrgRequest.mockReset().mockReturnValue({
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
        name: 'Pending'
      }
    });

    res.mockResetAll();
  });

  it('then it should render error if request has been actioned', async () => {
    getAndMapOrgRequest.mockReset().mockReturnValue({
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
        id: 1,
        name: 'approved'
      }
    });

    await post(req, res);

    expect(updateRequestById.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('accessRequests/views/rejectOrganisationRequest');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: '/access-requests/org1/requests',
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
          id: 1,
          name: 'approved'
        },
        user_id: 'userId',
        usersEmail: 'john.doe@email.com',
        usersName: 'John Doe'
      },
      reason: 'reason for rejection',
      title: 'Reason for rejection - DfE Sign-in',
      validationMessages: {
        reason: 'Request already actioned by john.doe@email.com'
      }
    });
  });

  it('then it should render error view if rejection reason is to long', async () => {
    req.body.reason = createString(1001);

    await post(req, res);

    expect(updateRequestById.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('accessRequests/views/rejectOrganisationRequest');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: '/access-requests/org1/requests',
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
          name: 'Pending'
        },
        user_id: 'userId',
        usersEmail: 'john.doe@email.com',
        usersName: 'John Doe'
      },
      reason: req.body.reason,
      title: 'Reason for rejection - DfE Sign-in',
      validationMessages: {
        reason: 'Reason cannot be longer than 1000 characters'
      }
    });
  });

  it('then it should patch the request as rejected', async () => {
    await post(req, res);

    expect(updateRequestById.mock.calls).toHaveLength(1);
    expect(updateRequestById.mock.calls[0][0]).toBe('requestId');
    expect(updateRequestById.mock.calls[0][1]).toBe(-1);
    expect(updateRequestById.mock.calls[0][2]).toBe('user1');
    expect(updateRequestById.mock.calls[0][3]).toBe('reason for rejection');
    expect(updateRequestById.mock.calls[0][4]).toBe('2019-01-02');
    expect(updateRequestById.mock.calls[0][5]).toBe('correlationId');
  });

  it('then it should should audit rejected org request', async () => {
    await post(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('email@email.com (id: user1) rejected organisation request for org1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'approver',
      subType: 'rejected-org',
      userId: 'user1',
      editedUser: 'userId',
      reason: 'reason for rejection'
    });
  });

  it('then it should redirect to the requests view', async () => {
    await post(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/access-requests/org1/requests');
  });
});
