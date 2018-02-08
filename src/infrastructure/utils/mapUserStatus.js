const mapUserStatus = (status, changedOn = null) => {
  if (status === 0) {
    return { id: 0, description: 'Deactivated', changedOn };
  }
  return { id: 1, description: 'Active', changedOn };
};

module.exports = mapUserStatus;
