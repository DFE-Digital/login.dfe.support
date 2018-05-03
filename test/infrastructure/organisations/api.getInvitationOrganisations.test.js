jest.mock('request-promise');
jest.mock('agentkeepalive', () => {
  return {
    HttpsAgent : jest.fn()
  }
});
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  organisations: {
    type: 'api',
    service: {
      url: 'http://organisations.test',
    },
  },
}));

const rp = jest.fn();
const requestPromise = require('request-promise');
requestPromise.defaults.mockReturnValue(rp);

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getInvitationOrganisations } = require('./../../../src/infrastructure/organisations/api');

const invitationId = 'bb185bc5-ed6f-473f-9bbd-e1ef565306e0';
const correlationId = 'abc123';
// const apiResponse = [
//   {
//     invitationId: invitationId,
//     role: {
//       id: 0,
//       name: 'End user'
//     },
//     service: {
//       id: '3bfde961-f061-4786-b618-618deaf96e44',
//       name: 'Key to success (KtS)'
//     },
//     organisation: {
//       id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
//       name: 'Big School'
//     }
//   }
// ];
const apiResponse = [
  {
    invitationId: invitationId,
    organisation: {
      id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
      name: 'Big School'
    },
    role: {
      id: 0,
      name: 'End user'
    },
    approvers: [],
    services: [{
      id: '3bfde961-f061-4786-b618-618deaf96e44',
      name: 'Key to success (KtS)'
    }],
  },
];

describe('when getting a page of organisations from api', () => {
  beforeEach(() => {
    rp.mockReset();
    rp.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });

  it('then it should call invitations resource with invitation id', async () => {
    await getInvitationOrganisations(invitationId, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://organisations.test/invitations/v2/bb185bc5-ed6f-473f-9bbd-e1ef565306e0',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getInvitationOrganisations(invitationId, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getInvitationOrganisations(invitationId, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('then it should invitation org mapping', async () => {
    const actual = await getInvitationOrganisations(invitationId, correlationId);

    expect(actual).toMatchObject(apiResponse);
  });
});
