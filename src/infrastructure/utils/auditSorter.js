const auditSorter = (x, y) => {
  const xTime = x.timestamp.getTime();
  const yTime = y.timestamp.getTime();
  if (xTime > yTime) {
    return -1;
  }
  if (xTime < yTime) {
    return 1;
  }
  return 0;
};

module.exports = auditSorter;
