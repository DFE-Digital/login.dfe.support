const getDevices = async (correlationId) => {
  return Promise.resolve([
    {serialNumber: '123-456-789'},
    {serialNumber: '234-567-890'},
  ]);
};

const deviceExists = async (serialNumber, correlationId) => {
  return Promise.resolve(false);
};

const syncDigipassToken = async(serialNumber, code1, code2) => {
  return Promise.resolve(true);
};

const deactivateToken = async () => {
  return Promise.resolve(true);
};

module.exports = {
  getDevices,
  deviceExists,
  syncDigipassToken,
};
