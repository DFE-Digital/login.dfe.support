const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');

const {organisation} = require('login.dfe.dao');

const getppsyncStatus = async (req, res) => {
    const ppauditData = await organisation.getPpAudit();
    sendResult(req, res, 'organisations/views/ppsyncStatus', {
        csrfToken: req.csrfToken(),
        audits : ppauditData
    });
};

module.exports = getppsyncStatus;
