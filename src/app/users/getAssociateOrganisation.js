const logger = require("./../../infrastructure/logger");

const getAssociateOrganisation = async (req, res) => {
  delete req.session.user.organisationId;
  delete req.session.user.organisationName;
  delete req.session.user.permission;

  req.session.save((error) => {
    if (error) {
      // Simply report that the error happened but continue as it only matters in one
      // uncommon journey (pick an org, confirm user, click back, press skip this step)
      logger.error(
        "Something went wrong saving the session when clearing user invite organisation details",
        error,
      );
      res.flash("info", "Failed to clear invited user organisation details");
    }

    res.render("users/views/associateOrganisation", {
      csrfToken: req.csrfToken(),
      layout: "sharedViews/layout.ejs",
      backLink: true,
      currentPage: "users",
      criteria: "",
      results: undefined,
      page: 1,
      numberOfPages: 1,
      numberOfResults: 1,
      firstRecordNumber: 1,
      lastRecordNumber: 1,
      canSkip: req.params.uid ? false : true,
    });
  });
};

module.exports = getAssociateOrganisation;
