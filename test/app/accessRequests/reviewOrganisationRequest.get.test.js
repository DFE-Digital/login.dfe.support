jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/app/accessRequests/utils');

const { getRequestMock, getResponseMock } = require('./../../utils');
const orgUtils = require('./../../../src/app/accessRequests/utils');
const { get } = require('./../../../src/app/accessRequests/reviewOrganisationRequest');

const res = getResponseMock();

describe('when reviewing an organisation request', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      user: {
        sub: 'user1',
      },
      params: {
        orgId: 'org1',
      },
    });

    orgUtils.getAndMapOrgRequest
      .mockReset()
      .mockReturnValue({
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

  it('then it should display the review request view', async () => {
    await get(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('accessRequests/views/reviewOrganisationRequest');
  });

  it('then it should get the mapped request', async () => {
    await get(req, res);

    expect(orgUtils.getAndMapOrgRequest.mock.calls).toHaveLength(1);
    expect(orgUtils.getAndMapOrgRequest.mock.calls[0][0]).toBe(req);
  });

  it('then it should include csrf token', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the request details', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      request: {
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
      },
    });
  });
});
