jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({}));
jest.mock('./../../../src/infrastructure/directories');
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());

const { getRequestMock } = require('./../../utils');
const post = require('./../../../src/app/users/postConfirmInvitationDeactivate');
const { getUserDetails, getUserDetailsById, updateUserDetails } = require('./../../../src/app/users/utils');
const logger = require('./../../../src/infrastructure/logger');
const { deactivateInvite } = require('./../../../src/infrastructure/directories');

describe('When processing a post for a user invitation deactivate request', () => {
  const expectedUserId = 'uid-user-1';

  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        reason: 'deactivate the invitation',
      },
    });

    res = {
      redirect: jest.fn(),
    };


    getUserDetails.mockReset().mockReturnValue({ id: expectedUserId, status: { id: -1 } });

    getUserDetailsById.mockReset().mockReturnValue({ id: expectedUserId, status: { id: -1 } });

    updateUserDetails.mockReset();
  });

  test('then it updates the user setting the status to deactivated', async () => {
    await post(req, res);

    expect(deactivateInvite.mock.calls).toHaveLength(1);
    expect(deactivateInvite.mock.calls[0][0]).toBe(expectedUserId);
    expect(deactivateInvite.mock.calls[0][1]).toBe('deactivate the invitation');
    expect(deactivateInvite.mock.calls[0][2]).toBe(req.id);
  });

  test('then the user index is updated', async () => {
    await post(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      status: {
        id: -2,
        description: 'Deactivated Invitation',
      }
    })
  });

  it('then the event is audited', async () => {
    await post(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
  });

  it('then the user is redirected to the services page', async () => {
    await post(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('services');
  });
});