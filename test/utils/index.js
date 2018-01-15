const loggerMockFactory = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    audit: jest.fn(),
  };
};

const configMockFactory = () => {
  return {
    cache: {
      type: 'static',
    },
  };
};

module.exports = {
  loggerMockFactory,
  configMockFactory,
};
