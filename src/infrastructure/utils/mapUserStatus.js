const mapUserStatus = (status) => {
  if (status === 0) {
    return { id: 1, description: 'Deactivated' };
  }
  return { id: 1, description: 'Active' };
};

module.exports = mapUserStatus;
