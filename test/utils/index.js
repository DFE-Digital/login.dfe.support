const loggerMockFactory = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    audit: jest.fn(),
  };
};

const configMockFactory = (customConfig) => {
  return Object.assign({
    hostingEnvironment: {
      agentKeepAlive: {}
    },
    cache: {
      type: 'static',
    },
    directories: {
      type: 'static',
    },
    organisations: {
      type: 'static',
    },
    serviceMapping: {
      type: 'static',
    },
    audit: {
      type: 'static',
    },
    devices: {
      type: 'static',
    },
    hotConfig: {
      type: 'static',
    },
    loggerSettings: {

    },
  }, customConfig);
};

const getRequestMock = (customRequest = {}) => {
  return Object.assign({
    id: 'correlationId',
    csrfToken: jest.fn().mockReturnValue('token'),
    accepts: jest.fn().mockReturnValue(['text/html']),
    params: {},
    body: {},
    user: {
      sub: 'suser1',
      email: 'super.user@unit.test',
    },
    session: {},
  }, customRequest);
};

const getResponseMock = () => {
  const res = {
    render: jest.fn(),
    redirect: jest.fn(),
    status: jest.fn(),
    contentType: jest.fn(),
    send: jest.fn(),
    flash: jest.fn(),
  };

  res.render.mockReturnValue(res);
  res.redirect.mockReturnValue(res);
  res.status.mockReturnValue(res);
  res.contentType.mockReturnValue(res);

  return res;
};

module.exports = {
  loggerMockFactory,
  configMockFactory,
  getRequestMock,
  getResponseMock,
};
