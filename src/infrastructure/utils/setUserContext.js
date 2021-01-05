'use strict';

const setUserContext = async (req, res, next) => {
    res.locals.gaClientId = req.session.gaClientId;
    next();
};

module.exports = setUserContext;
