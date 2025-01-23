"use strict";

const complete = (req, res) => {
  res.render("signOut/views/complete", {
    hideSignOut: true,
  });
};

module.exports = complete;
