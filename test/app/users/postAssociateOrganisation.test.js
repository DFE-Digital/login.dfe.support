jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { searchOrganisations, getOrganisationById } = require('./../../../src/infrastructure/organisations');
const postAssociateOrganisation = require('./../../../src/app/users/postAssociateOrganisation');

const res = getResponseMock();

describe('when associating user to organisations', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        criteria: 'something',
        page: 1,
      },
      session: {
        newUser: {
          firstName: 'James',
          lastName: 'Howlett',
          email: 'logan@x-men.test',
        }
      }
    });

    res.mockResetAll();

    searchOrganisations.mockReset().mockReturnValue({
      organisations: [
        { id: 'org1' },
      ],
      totalNumberOfPages: 2,
      totalNumberOfRecords: 49,
    });

    getOrganisationById.mockReset().mockReturnValue({
      id: 'org1',
      name: 'Organisation One',
    });
  });

  it('then it should return search results for organisations', async () => {
    await postAssociateOrganisation(req, res);

    expect(searchOrganisations.mock.calls).toHaveLength(1);
    expect(searchOrganisations.mock.calls[0][0]).toBe('something');
    expect(searchOrganisations.mock.calls[0][1]).toBe(1);
    expect(searchOrganisations.mock.calls[0][2]).toBe('correlationId');

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/associateOrganisation');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      criteria: 'something',
      results: [
        { id: 'org1' },
      ],
      currentPage: 1,
      numberOfPages: 2,
      numberOfResults: 49,
      firstRecordNumber: 1,
      lastRecordNumber: 25
    });
  });

  it('then it should update new user in session if organisation is selected', async () => {
    req.body = {
      selectedOrganisation: 'org1',
    };

    await postAssociateOrganisation(req, res);

    expect(req.session.newUser.organisationId).toBe('org1');
    expect(req.session.newUser.organisationName).toBe('Organisation One');
  });

  it('then it should redirect to organisation permissions if organisation is selected', async () => {
    req.body = {
      selectedOrganisation: 'org1',
    };

    await postAssociateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('organisation-permissions');

    expect(searchOrganisations.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(0);
  });
});
