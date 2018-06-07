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
const { getOrganisationUsersForApproval } = require('./../../../src/infrastructure/organisations/api');

const correlationId = 'abc123';
const apiResponse = {
  organisations: [{
    id: 'org1',
    name: 'org one',
  }],
  page: 1,
  totalNumberOfPages: 2,
};

describe('when getting a page of organisations users for approval from api', () => {
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

  it('then it should call organisations resource with page number', async () => {
    await getOrganisationUsersForApproval(2, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://organisations.test/organisations/users-for-approval?page=2',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getOrganisationUsersForApproval(2, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getOrganisationUsersForApproval(2, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('then it should return page of orgs from api', async () => {
    const actual = await getOrganisationUsersForApproval(2, correlationId);

    expect(actual).not.toBeNull();
    expect(actual.totalNumberOfPages).toBe(2);
    expect(actual.organisations).toHaveLength(1);
    expect(actual.organisations[0]).toMatchObject({
      id: 'org1',
      name: 'org one',
    });
  });
});
