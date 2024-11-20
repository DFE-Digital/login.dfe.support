jest.mock('login.dfe.async-retry');

process.env.AUDIT_HTTP_TRIGGER_URL = 'http://audit.test';

const { fetchApi } = require('login.dfe.async-retry');
const { updateAuditLogs } = require('../../../src/infrastructure/audit/api');

const apiResponse = {};

describe('when using the updateAuditLogs function', () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });
  });

  it('should POST to the the url defined in proces.env.AUDIT_HTTP_TRIGGER_URL', async () => {
    await updateAuditLogs();

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://audit.test');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'POST',
    });
  });

  it('should return null on a 404 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('not found');
      error.statusCode = 404;
      throw error;
    });

    const result = await updateAuditLogs();
    expect(result).toEqual(null);
  });

  it('should raise an exception on any failure status code that is not 404', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Server Error');
      error.statusCode = 500;
      throw error;
    });

    const act = () => updateAuditLogs();

    await expect(act).rejects.toThrow(expect.objectContaining({
      message: 'Server Error',
      statusCode: 500,
    }));
  });
});
