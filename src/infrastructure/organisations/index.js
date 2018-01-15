const getUserOrganisations = async (userId) => {
  return Promise.resolve([
    {
      "userService": {
        "id": "b7526206-7760-4024-b869-97004350cb8b",
        "userId": "77d6b281-9f8d-4649-84b8-87fc42eee71d",
        "status": 0
      },
      "organisation": {
        "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        "name": "Test Org"
      },
      "service": {
        "id": "77d6b281-9f8d-4649-84b8-87fc42eee71d",
        "name": "Test Service"
      }
    }
  ]);
};

module.exports = {
  getUserOrganisations,
};
