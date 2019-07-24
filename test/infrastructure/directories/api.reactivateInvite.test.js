jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  directories: {
    type: 'api',
    service: {
      url: 'http://directories.test',
    },
  },
}));

const rp = jest.fn();
const requestPromise = require('login.dfe.request-promise-retry');
requestPromise.defaults.mockReturnValue(rp);

const jwtStrategy = require('login.dfe.jwt-strategies');
const { reactivateInvite } = require('./../../../src/infrastructure/directories/api');

const correlationId = 'abc123';
const invitationId = 'invite1';
const reason = 'invite deactivated by mistake';

describe('when reactivating an invite from the directories api', () => {
  beforeEach(() => {
    rp.mockReset();
    rp.mockImplementation(() => {

    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });

  it('then it should call invitations resource with invitation id', async () => {
    await reactivateInvite(invitationId, reason, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'PATCH',
      uri: 'http://directories.test/invitations/invite1',
    });
  });

  it('then the reason for reactivate is in the body', async () => {
    await reactivateInvite(invitationId, reason, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      body: {
        reason: 'invite deactivated by mistake',
        deactivated: true,
      },
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await reactivateInvite(invitationId, reason, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await reactivateInvite(invitationId, reason, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });
});
