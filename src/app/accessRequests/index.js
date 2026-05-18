const express = require("express");
const { asyncWrapper } = require("login.dfe.express-helpers/error-handling");
const {
  isLoggedIn,
  setCurrentArea,
  isRequestApprover,
} = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");
const {
  get: getOrganisationRequests,
  post: postOrganisationRequests,
} = require("./organisationRequests");
const {
  get: getReviewOrganisationRequest,
  post: postReviewOrganisationRequest,
} = require("./reviewOrganisationRequest");
const {
  get: getRejectOrganisationRequest,
  post: postRejectOrganisationRequest,
} = require("./rejectOrganisationRequest");
const {
  get: getSelectPermissionLevel,
  post: postSelectPermissionLevel,
} = require("./selectPermissionLevel");
const {
  get: getReviewServiceRequest,
  post: postReviewServiceRequest,
} = require("./reviewServiceRequest");
const {
  get: getRejectServiceRequest,
  post: postRejectServiceRequest,
} = require("./rejectServiceRequest");
const { post: postApproveServiceRequest } = require("./approveServiceRequest");

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.debug("Mounting accessRequests routes");

  router.use(isLoggedIn);
  router.use(isRequestApprover);
  router.use(setCurrentArea("users"));

  router.get("/", csrf, asyncWrapper(getOrganisationRequests));
  router.post("/", csrf, asyncWrapper(postOrganisationRequests));

  router.get(
    "/:rid/service-request/review",
    csrf,
    asyncWrapper(getReviewServiceRequest),
  );
  router.post(
    "/:rid/service-request/review",
    csrf,
    asyncWrapper(postReviewServiceRequest),
  );
  router.get(
    "/:rid/service-request/reject",
    csrf,
    asyncWrapper(getRejectServiceRequest),
  );
  router.post(
    "/:rid/service-request/reject",
    csrf,
    asyncWrapper(postRejectServiceRequest),
  );
  router.post(
    "/:rid/service-request/approve",
    csrf,
    asyncWrapper(postApproveServiceRequest),
  );

  router.get(
    "/:rid/:from?/review",
    csrf,
    asyncWrapper(getReviewOrganisationRequest),
  );
  router.post(
    "/:rid/:from?/review",
    csrf,
    asyncWrapper(postReviewOrganisationRequest),
  );
  router.get(
    "/:rid/:from?/reject",
    csrf,
    asyncWrapper(getRejectOrganisationRequest),
  );
  router.post(
    "/:rid/:from?/reject",
    csrf,
    asyncWrapper(postRejectOrganisationRequest),
  );
  router.get(
    "/:rid/:from?/approve",
    csrf,
    asyncWrapper(getSelectPermissionLevel),
  );
  router.post(
    "/:rid/:from?/approve",
    csrf,
    asyncWrapper(postSelectPermissionLevel),
  );

  return router;
};

module.exports = users;
