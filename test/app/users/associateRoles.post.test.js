jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('login.dfe.policy-engine');

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();

describe('when selecting the roles for a service', () => {
  let req;
  let postAssociateRoles;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        orgId: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
        sid: 'service1',
      },
      session: {
        user: {
          email: 'test@test.com',
          firstName: 'test',
          lastName: 'name',
          services: [
            {
              serviceId: 'service1',
              roles: [{ 0: "somerole"}],
            }
          ]
        },
      },
    });
    res.mockResetAll();

    postAssociateRoles = require('./../../../src/app/users/associateRoles').post;
  });

  it('then it should redirect to confirm add service page if no more services', async () => {
    await postAssociateRoles(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/users/${req.params.uid}/organisations/${req.params.orgId}/confirm`);
  });

  it('then it should redirect to the next service if one exists', async () => {
    req.session.user.services = [
      {
        serviceId: 'service1',
        roles: [ { 0: "somedifferentrole"}],
      },
      {
        serviceId: 'service2',
        roles: [{ 0: "somedifferentrole"}],
      }
    ];
    await postAssociateRoles(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('service2');
  });

  it('then it should redirect to user details if no user in session', async () => {
    req.session.user = null;
    await postAssociateRoles(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/users/${req.params.uid}/organisations`);
  });
});
