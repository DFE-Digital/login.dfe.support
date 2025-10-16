const { mapUserStatus } = require("../../../infrastructure/utils");

const mapSearchUserToSupportModel = (user) => {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organisation: user.primaryOrganisation
      ? {
          name: user.primaryOrganisation,
        }
      : null,
    organisations: user.organisations,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    successfulLoginsInPast12Months: user.numberOfSuccessfulLoginsInPast12Months,
    status: mapUserStatus(user.statusId, user.statusLastChangedOn),
    pendingEmail: user.pendingEmail,
  };
};

module.exports = {
  mapSearchUserToSupportModel,
};
