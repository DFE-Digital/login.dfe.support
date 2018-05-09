const userStatusMap = [
  { id: -2, name: 'Deactivated Invitation' },
  { id: -1, name: 'Invited' },
  { id: 0, name: 'Deactivated' },
  { id: 1, name: 'Active' },
];

const mapUserStatus = (status, changedOn = null) => {
  // TODO: use userStatusMap
  if (status === -2) {
    return { id: -2, description: 'Deactivated Invitation', changedOn };
  }
  if (status === -1) {
    return { id: -1, description: 'Invited', changedOn };
  }
  if (status === 0) {
    return { id: 0, description: 'Deactivated', changedOn };
  }
  return { id: 1, description: 'Active', changedOn };
};

module.exports = {
  mapUserStatus,
  userStatusMap,
};
