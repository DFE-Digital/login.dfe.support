const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');

const {organisation} = require('login.dfe.dao');

const getppsyncStatus = async (req, res) => {
    const ppauditData = await organisation.getPpAudit();
    const activeSync = ppauditData.filter(f=> (f.statusStep1===1 && f.endDate === null));
    if(activeSync && activeSync.length > 0) {
        req.syncInP = true;
    }
        sendResult(req, res, 'organisations/views/ppsyncStatus', {
        csrfToken: req.csrfToken(),
        audits : ppauditData,
        syncInP : req.syncInP,
            cancelLink : '/organisations'
    });
};

module.exports = getppsyncStatus;
