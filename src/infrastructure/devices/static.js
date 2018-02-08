const getDevices = async (correlationId) => {
  return Promise.resolve([
    {serialNumber: '123-456-789'},
    {serialNumber: '234-567-890'},
  ]);
};

module.exports = {
  getDevices,
};
