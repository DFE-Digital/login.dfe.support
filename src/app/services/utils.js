const {
  getPaginatedServicesRaw,
  getServiceToggleFlagsRaw,
} = require("login.dfe.api-client/services");

const getAllServices = async () => {
  const services = [];

  let pageNumber = 1;
  let numberOfPages = undefined;
  while (numberOfPages === undefined || pageNumber <= numberOfPages) {
    const page = await getPaginatedServicesRaw({
      pageNumber: pageNumber,
      pageSize: 50,
    });

    services.push(...page.services);

    numberOfPages = page.numberOfPages;
    pageNumber += 1;
  }

  return { services };
};

const retrieveToggleFlag = async (fliters) => {
  const emailToggleFlag = await getServiceToggleFlagsRaw(fliters);
  if (emailToggleFlag && emailToggleFlag.length === 1) {
    return emailToggleFlag[0].flag;
  }
  return true;
};

const isSupportEmailNotificationAllowed = async () => {
  return await retrieveToggleFlag({
    filters: { serviceToggleType: "email", serviceName: "support" },
  });
};

module.exports = {
  getAllServices,
  isSupportEmailNotificationAllowed,
};
