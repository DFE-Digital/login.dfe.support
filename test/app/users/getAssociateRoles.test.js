jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());

jest.mock('login.dfe.policy-engine');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/applications', () => {
  return {
    getServiceById: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require('./../../utils');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const { getUserOrganisations } = require('./../../../src/infrastructure/organisations');
const res = getResponseMock();

describe('when displaying the associate roles view', () => {
  let req;
  let getAssociateRoles;

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
              roles: [],
            }
          ]
        },
      },
    });
    res.mockResetAll();

    getUserOrganisations.mockReset();
    getUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
          name: 'Great Big School'
        },
      },
      {
        organisation: {
          id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
          name: 'Little Tiny School'
        },
      },
    ]);
    getAssociateRoles = require('./../../../src/app/users/associateRoles').get;
  });

  it('then it should return the associate roles view', async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/associateRoles');
  });


  it('then it should include csrf token', async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the organisation details', async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisationDetails: {
        organisation: {
          id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
          name: 'Great Big School'
        },
      },
    });
  });

  it('then it should include the number of selected services', async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      totalNumberOfServices: req.session.user.services.length,
    });
  });

  it('then it should include the current service', async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      currentService: 1,
    });
  });

  it('then it should get the service details', async () => {
    await getAssociateRoles(req, res);
    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
  });
});

