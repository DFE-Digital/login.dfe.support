jest.mock('./../../../src/infrastructure/config', () =>
  require('./../../utils').configMockFactory()
);
jest.mock('./../../../src/infrastructure/logger', () =>
  require('./../../utils').loggerMockFactory()
);
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/directories');

const logger = require('./../../../src/infrastructure/logger');
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
} = require('./../../../src/app/users/utils');
const { deactivate } = require('./../../../src/infrastructure/directories');
const postConfirmDeactivate = require('./../../../src/app/users/postConfirmDeactivate');

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
      reason: 'some reason for deactivation',
    },
    user: {
      sub: 'suser1',
      email: 'super.user@unit.test',
    },
  };

  res = {
    redirect: jest.fn(),
  };

  logger.audit.mockReset();

  getUserDetails.mockReset().mockReturnValue({
    id: '915a7382-576b-4699-ad07-a9fd329d3867',
    name: 'Rupert Grint',
    firstName: 'Rupert',
    lastName: 'Grint',
    email: 'rupert.grint@hogwarts.test',
    organisationName: 'Hogwarts School of Witchcraft and Wizardry',
    lastLogin: null,
    status: {
      id: 1,
      description: 'Active',
    },
    loginsInPast12Months: {
      successful: 0,
    },
  });

  getUserDetailsById.mockReset().mockReturnValue({
    id: '915a7382-576b-4699-ad07-a9fd329d3867',
    name: 'Rupert Grint',
    firstName: 'Rupert',
    lastName: 'Grint',
    email: 'rupert.grint@hogwarts.test',
    organisationName: 'Hogwarts School of Witchcraft and Wizardry',
    lastLogin: null,
    status: {
      id: 1,
      description: 'Active',
    },
    loginsInPast12Months: {
      successful: 0,
    },
  });

  updateUserDetails.mockReset();
});

describe('When confirming deactivation of user', () => {
  it('then it should redirect to view user profile', async () => {
    await postConfirmDeactivate(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('services');
  });

  it('then it should deactivate user record in directories', async () => {
    await postConfirmDeactivate(req, res);

    expect(deactivate.mock.calls).toHaveLength(1);
    expect(deactivate.mock.calls[0][0]).toBe(
      '915a7382-576b-4699-ad07-a9fd329d3867'
    );
    expect(deactivate.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should update user in search index', async () => {
    await postConfirmDeactivate(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      status: {
        id: 0,
        description: 'Deactivated',
      },
    });
  });

  it('then it should should audit user being deactivated', async () => {
    await postConfirmDeactivate(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      'super.user@unit.test (id: suser1) deactivated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)'
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'support',
      subType: 'user-edit',
      userId: 'suser1',
      userEmail: 'super.user@unit.test',
      editedUser: '915a7382-576b-4699-ad07-a9fd329d3867',
      editedFields: [
        {
          name: 'status',
          oldValue: 1,
          newValue: 0,
        },
      ],
      reason: 'some reason for deactivation',
    });
  });
});



describe('When confirming deactivation of user given a reason from the select menu', () => {

  beforeEach(() => {
    req.body = {
      reason: '',
      'select-reason': 'some selected reason for deactivation',
    };
  });

  it('then it should redirect to view user profile', async () => {
    await postConfirmDeactivate(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('services');
  });

  it('then it should deactivate user record in directories', async () => {
    await postConfirmDeactivate(req, res);

    expect(deactivate.mock.calls).toHaveLength(1);
    expect(deactivate.mock.calls[0][0]).toBe(
      '915a7382-576b-4699-ad07-a9fd329d3867'
    );
    expect(deactivate.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should update user in search index', async () => {
    await postConfirmDeactivate(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      status: {
        id: 0,
        description: 'Deactivated',
      },
    });
  });

  it('then it should should audit user being deactivated', async () => {
    await postConfirmDeactivate(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      'super.user@unit.test (id: suser1) deactivated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)'
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'support',
      subType: 'user-edit',
      userId: 'suser1',
      userEmail: 'super.user@unit.test',
      editedUser: '915a7382-576b-4699-ad07-a9fd329d3867',
      editedFields: [
        {
          name: 'status',
          oldValue: 1,
          newValue: 0,
        },
      ],
      reason: 'some selected reason for deactivation',
    });
  });
});

describe('When confirming deactivation of user given a reason from the select menu and a text reason', () => {

  beforeEach(() => {
    req.body = {
      reason: 'some text reason for deactivation',
      'select-reason': 'some selected reason for deactivation',
    };
  });

  it('then it should redirect to view user profile', async () => {
    await postConfirmDeactivate(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('services');
  });

  it('then it should deactivate user record in directories', async () => {
    await postConfirmDeactivate(req, res);

    expect(deactivate.mock.calls).toHaveLength(1);
    expect(deactivate.mock.calls[0][0]).toBe(
      '915a7382-576b-4699-ad07-a9fd329d3867'
    );
    expect(deactivate.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should update user in search index', async () => {
    await postConfirmDeactivate(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: '915a7382-576b-4699-ad07-a9fd329d3867',
      name: 'Rupert Grint',
      email: 'rupert.grint@hogwarts.test',
      organisationName: 'Hogwarts School of Witchcraft and Wizardry',
      lastLogin: null,
      status: {
        id: 0,
        description: 'Deactivated',
      },
    });
  });

  it('then it should audit user being deactivated', async () => {
    await postConfirmDeactivate(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      'super.user@unit.test (id: suser1) deactivated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)'
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'support',
      subType: 'user-edit',
      userId: 'suser1',
      userEmail: 'super.user@unit.test',
      editedUser: '915a7382-576b-4699-ad07-a9fd329d3867',
      editedFields: [
        {
          name: 'status',
          oldValue: 1,
          newValue: 0,
        },
      ],
      reason: 'some selected reason for deactivation - some text reason for deactivation',
    });
  });
});