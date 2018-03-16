const patchChangeHistory = (changeHistory) => {
  changeHistory.audits = changeHistory.audits.map((audit) => {
    if (audit.editedFields && !(audit.editedFields instanceof Array)) {
      audit.editedFields = JSON.parse(audit.editedFields);
    }
    return audit;
  });
};

module.exports = patchChangeHistory;
