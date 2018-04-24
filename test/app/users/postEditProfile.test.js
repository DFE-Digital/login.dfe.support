jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/infrastructure/users');
jest.mock('./../../../src/infrastructure/userDevices');

const logger = require('./../../../src/infrastructure/logger');
const { getUserDetails } = require('./../../../src/app/users/utils');
const { updateUser } = require('./../../../src/infrastructure/directories');
const { getById, updateIndex } = require('./../../../src/infrastructure/users');
const userDevices = require('./../../../src/infrastructure/userDevices');
const postEditProfile = require('./../../../src/app/users/postEditProfile');

describe('when updating users profile details', () => {
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
      body: {
        firstName: 'Rupert',
        lastName: 'Grint',
      },
      user: {
        sub: 'suser1',
        email: 'super.user@unit.test',
      }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };

    logger.audit.mockReset();

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Bobby Grint',
      firstName: 'Bobby',
      lastName: 'Grint',
      email: 'rupert.grint@hogwarts.test',
      lastLogin: null,
      status: {
        id: 1,
        description: 'Active'
      },
      loginsInPast12Months: {
        successful: 0,
      },
    });

    updateUser.mockReset();

    getById.mockReset().mockReturnValue({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Bobby Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      statusDescription: 'Active'
    });

    updateIndex.mockReset();

    userDevices.updateIndex.mockReset();
    userDevices.getByUserId.mockReset().mockReturnValue({
      uid: '915a7382-576b-4699-ad07-a9fd329d3867',
      serialNumber: '123test456',
      serialNumberFormatted: '123-test-456',
      name: 'Mr Test Testing',
      orgName: "My Org",
      lastLogin: '16:00:00  06/10/2017',
      numberOfSuccessfulLoginAttemptsInTwelveMonths: '25',
      tokenStatus: 'Active',
      audit:{audits: [{
        date:  '16:10:00  07/10/2017',
        event:'Login',
        result:'Success',
        user: 'Testing Tester',
      }]},
    });
  });

  it('then it should render view if firstName missing', async () => {
    req.body.firstName = undefined;

    await postEditProfile(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/editProfile');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        firstName: 'Please specify a first name',
      },
    });
  });

  it('then it should render view if lastName missing', async () => {
    req.body.lastName = undefined;

    await postEditProfile(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('users/views/editProfile');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        lastName: 'Please specify a last name',
      },
    });
  });

  it('then it should update user in directories', async () => {
    await postEditProfile(req, res);

    expect(updateUser.mock.calls).toHaveLength(1);
    expect(updateUser.mock.calls[0][0]).toBe('915a7382-576b-4699-ad07-a9fd329d3867');
    expect(updateUser.mock.calls[0][1]).toBe('Rupert');
    expect(updateUser.mock.calls[0][2]).toBe('Grint');
    expect(updateUser.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should update user in search index', async () => {
    await postEditProfile(req, res);

    expect(updateIndex.mock.calls).toHaveLength(1);
    expect(updateIndex.mock.calls[0][0]).toHaveLength(1);
    expect(updateIndex.mock.calls[0][0][0]).toMatchObject({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      statusDescription: 'Active'
    })
  });

  it('then it updates the record in the user devices index', async () => {
    await postEditProfile(req, res);

    expect(userDevices.getByUserId.mock.calls).toHaveLength(1);
    expect(userDevices.updateIndex.mock.calls).toHaveLength(1);
    expect(userDevices.updateIndex.mock.calls[0][0][0]).toMatchObject({
      name: 'Rupert Grint',
    })
  });

  it('then it should redirect to user services', async () => {
    await postEditProfile(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('services');
  });

  it('then it should audit update of user', async () => {
    await postEditProfile(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('super.user@unit.test (id: suser1) updated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'support',
      subType: 'user-edit',
      userId: 'suser1',
      userEmail: 'super.user@unit.test',
      editedUser: '915a7382-576b-4699-ad07-a9fd329d3867',
      editedFields: [
        {
          name: 'given_name',
          oldValue: 'Bobby',
          newValue: 'Rupert',
        }
      ]
    });
  })
});
