jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());


const { getRequestMock, getResponseMock } = require('./../../utils');
const { get } = require('./../../../src/app/accessRequests/rejectOrganisationRequest');

const res = getResponseMock();

describe('when rejecting an organisation request', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      user: {
        sub: 'user1',
      },
      params: {
        orgId: 'org1'
      },
    });
    res.mockResetAll();
  });

  it('then it should display the reject request view', async () => {
    await get(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('accessRequests/views/rejectOrganisationRequest');
  });

  it('then it should include csrf token', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include back link', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: true,
    });
  });

  it('then it should include cancel link', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      cancelLink: '/access-requests',
    });
  });
});
