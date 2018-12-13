'use strict';

const get = async (req, res) => {
  return res.render('users/views/associateRoles');
};

module.exports = {
  get,
};
