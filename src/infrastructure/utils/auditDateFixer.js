const auditDateFixer = (audit) => {
  audit.timestamp = new Date(audit.timestamp);
  return audit;
};

module.exports = auditDateFixer;
