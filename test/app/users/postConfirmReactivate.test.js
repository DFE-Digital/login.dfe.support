jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/users');

const logger = require('./../../../src/infrastructure/logger');
const { getUserDetails } = require('./../../../src/app/users/utils');
const { reactivate } = require('./../../../src/infrastructure/directories');
const { getById, updateIndex } = require('./../../../src/infrastructure/users');
const postConfirmReactivate = require('./../../../src/app/users/postConfirmReactivate');

describe('When reactivating an user account', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
      params: {
        uid: '915a7382-576b-4699-ad07-a9fd329d3867',
      },
      body: {},
      user: {
        sub: 'suser1',
        email: 'super.user@unit.test',
      }
    };

    res = {
      redirect: jest.fn(),
    };

    logger.audit.mockReset();

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      firstName: 'Rupert',
      lastName: 'Grint',
      email: 'rupert.grint@hogwarts.test',
      lastLogin: null,
      status: {
        id: 0,
        description: 'Deactivated'
      },
      loginsInPast12Months: {
        successful: 0,
      },
    });

    getById.mockReset().mockReturnValue({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      statusDescription: 'Active'
    });

    updateIndex.mockReset();
  });

  it('then it should redirect to view user profile', async () => {
    await postConfirmReactivate(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('services');
  });

  it('then it should activate user in directories', async () => {
    await postConfirmReactivate(req, res);

    expect(reactivate.mock.calls).toHaveLength(1);
    expect(reactivate.mock.calls[0][0]).toBe('915a7382-576b-4699-ad07-a9fd329d3867');
    expect(reactivate.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should update user in search index', async () => {
    await postConfirmReactivate(req, res);

    expect(updateIndex.mock.calls).toHaveLength(1);
    expect(updateIndex.mock.calls[0][0]).toHaveLength(1);
    expect(updateIndex.mock.calls[0][0][0]).toMatchObject({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      status:{
        id: 1,
        description: 'Active'
      }
    })
  });

  it('then it should should audit user being reactivated', async () => {
    await postConfirmReactivate(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('super.user@unit.test (id: suser1) reactivated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'support',
      subType: 'user-edit',
      userId: 'suser1',
      userEmail: 'super.user@unit.test',
      editedUser: '915a7382-576b-4699-ad07-a9fd329d3867',
      editedFields: [
        {
          name: 'status',
          oldValue: 0,
          newValue: 1,
        }
      ],
    });
  });
});
