jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/app/users/utils', () => {
  return {
    search: jest.fn().mockReturnValue({
      criteria: 'test',
      page: 1,
      numberOfPages: 3,
      users: []
    }),
  };
});
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/applications');

const utils = require('./../../../src/app/users/utils');
const { getOrganisationCategories } = require('./../../../src/infrastructure/organisations');
const { getAllServices } = require('./../../../src/infrastructure/applications');
const { post } = require('./../../../src/app/users/search');

describe('When processing a post to search for users', () => {
  let req;
  let res;
  let usersSearchResult;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        criteria: 'test',
      },
      csrfToken: () => {
        return 'token';
      },
      accepts: () => {
        return ['text/html'];
      },
    };

    req.session = jest.fn().mockReturnValue({ params: { ...req.query, redirectedFromOrganisations: true }})


    res = {
      render: jest.fn(),
    };

    usersSearchResult = [
      {
        name: 'Timmy Tester',
        email: 'timmy@tester.test',
        organisation: {
          name: 'Testco'
        },
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        status: {
          description: 'Active'
        }
      },
    ];

    utils.search.mockReset();
    utils.search.mockReturnValue({
      criteria: 'test',
      page: 1,
      numberOfPages: 3,
      sortBy: 'test',
      sortOrder: 'desc',
      users: usersSearchResult
    });

    getAllServices.mockReset().mockReturnValue({
      services: [
        { id: 'svc1', name: 'Service one' },
        { id: 'svc2', name: 'Service two' },]
    });

    getOrganisationCategories.mockReset().mockReturnValue([
      { id: 'org1', name: 'Organisation one' },
      { id: 'org2', name: 'Organisation two' },
    ])
  });

  test('then it should render the search view', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/search');
  });

  test('then it should include csrf token', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  test('then it should include criteria', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      criteria: 'test',
    });
  });

  test('then it should include page details', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      page: 1,
      numberOfPages: 3,
    });
  });

  test('then it includes the sort order and sort value', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      sortBy: 'test',
      sortOrder: 'desc'
    });
  });

  test('then it should include users', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      users: usersSearchResult,
    });
  });

  test('then it should load filter data if showing filters', async () => {
    req.body.showFilters = 'true';

    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisationTypes: [
        { id: 'org1', name: 'Organisation one', isSelected: false },
        { id: 'org2', name: 'Organisation two', isSelected: false },
      ],
      accountStatuses: [
        { id: -2, name: 'Deactivated Invitation', isSelected: false },
        { id: -1, name: 'Invited', isSelected: false },
        { id: 0, name: 'Deactivated', isSelected: false },
        { id: 1, name: 'Active', isSelected: false },
      ],
      services: [
        { id: 'svc1', name: 'Service one', isSelected: false },
        { id: 'svc2', name: 'Service two', isSelected: false },
      ],
    });
  });

  test('then it should persist selected filters', async () => {
    req.body.showFilters = 'true';
    req.body.organisationType = 'org1';
    req.body.accountStatus = ['-1', '1'];
    req.body.service = 'svc2';

    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisationTypes: [
        { id: 'org1', name: 'Organisation one', isSelected: true },
        { id: 'org2', name: 'Organisation two', isSelected: false },
      ],
      accountStatuses: [
        { id: -2, name: 'Deactivated Invitation', isSelected: false },
        { id: -1, name: 'Invited', isSelected: true },
        { id: 0, name: 'Deactivated', isSelected: false },
        { id: 1, name: 'Active', isSelected: true },
      ],
      services: [
        { id: 'svc1', name: 'Service one', isSelected: false },
        { id: 'svc2', name: 'Service two', isSelected: true },
      ],
    });
  });
});
