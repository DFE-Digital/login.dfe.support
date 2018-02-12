const getDevices = async (correlationId) => {
  return Promise.resolve([
    {serialNumber: '123-456-789'},
    {serialNumber: '234-567-890'},
  ]);
};

const deviceExists = async (serialNumber, correlationId) => {
  return Promise.resolve(false);
};

module.exports = {
  getDevices,
  deviceExists,
};
