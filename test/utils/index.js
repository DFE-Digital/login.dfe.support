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
    }
  }, customConfig);
};

module.exports = {
  loggerMockFactory,
  configMockFactory,
};
