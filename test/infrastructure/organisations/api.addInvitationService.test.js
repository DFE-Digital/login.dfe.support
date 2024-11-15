jest.mock('login.dfe.async-retry');
jest.mock('agentkeepalive', () => {
  return {
    HttpsAgent: jest.fn()
  }
});
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory({
  organisations: {
    type: 'api',
    service: {
      url: 'http://organisations.test',
    },
  },
}));

const { fetchApi } = require('login.dfe.async-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { addInvitationService } = require('../../../src/infrastructure/organisations/api');

const invitationId = 'inv-1';
const organisationId = 'org-1';
const serviceId = 'service-1';
const roleId = 'role-1';
const externalIdentifiers = [];
const correlationId = 'abc123';
const apiResponse = {
  users: [],
  numberOfPages: 1,
};

describe('when getting a service by id from api', () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });

  it('then it should call services resource with service id', async () => {
    await addInvitationService(invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://organisations.test/organisations/org-1/services/service-1/invitations/inv-1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await addInvitationService(invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await addInvitationService(invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('should return null on a 401 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('not found');
      error.statusCode = 404;
      throw error;
    });

    const result = await addInvitationService(invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId);
    expect(result).toEqual(null);
  });

  it('should return null on a 404 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('unauthorized');
      error.statusCode = 401;
      throw error;
    });

    const result = await addInvitationService(invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId);
    expect(result).toEqual(null);
  });

  it('should return false on a 409 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Conflict');
      error.statusCode = 409;
      throw error;
    });

    const result = await addInvitationService(invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId);
    expect(result).toEqual(false);
  });

  it('should raise an exception on any failure status code that is not 401, 404 or 409', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Server Error');
      error.statusCode = 500;
      throw error;
    });

    try {
      await addInvitationService(invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId);
    } catch (e) {
      expect(e.statusCode).toEqual(500);
      expect(e.message).toEqual('Server Error');
    }
  });
});
