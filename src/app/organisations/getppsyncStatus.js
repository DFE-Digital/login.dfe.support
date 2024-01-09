const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');

const {organisation} = require('login.dfe.dao');

const getppsyncStatus = async (req, res) => {

    const audits = [];

    const ppauditData = await organisation.getPpAudit();

    console.log(ppauditData);

    sendResult(req, res, 'organisations/views/getppsyncStatus', {
        csrfToken: req.csrfToken(),
        audits : ppauditData
    });
};

module.exports = getppsyncStatus;
