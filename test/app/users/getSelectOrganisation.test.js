jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());

jest.mock('./../../../src/infrastructure/organisations');

const { getUserOrganisations } = require('./../../../src/infrastructure/organisations');

describe('when displaying the multiple organisation selection', () => {

  let req;
  let res;

  let getMultipleOrgSelection;

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

    getMultipleOrgSelection = require('./../../../src/app/users/selectOrganisation').get;
  });

  it('then it should return the multiple orgs view', async () => {
    await getMultipleOrgSelection(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/selectOrganisation');
  });

  it('then it should include csrf token in model', async () => {
    await getMultipleOrgSelection(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the users organisations in the model', async () => {
    await getMultipleOrgSelection(req, res);
    expect(getUserOrganisations.mock.calls).toHaveLength(1);
    expect(getUserOrganisations.mock.calls[0][0]).toBe('user1');
    expect(getUserOrganisations.mock.calls[0][1]).toBe('correlationId');
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      naturalIdentifiers: [],
      organisation: {
        id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
        name: 'Little Tiny School',
      }

    });
  });

});
