const { sendResult, mapUserStatus } = require('./../../infrastructure/utils');

const {organisation} = require('login.dfe.dao');

const getppsyncStatus = async (req, res) => {
    const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;

    const ppauditData = await organisation.getPpAuditPaging(pageNumber);
    const activeSync = ppauditData.audits.filter(f=> (f.statusStep1===1 && f.endDate === null));
    if(activeSync && activeSync.length > 0) {
        req.syncInP = true;
    }
        sendResult(req, res, 'organisations/views/ppsyncStatus', {
        csrfToken: req.csrfToken(),
        audits : ppauditData.audits,
        syncInP : req.syncInP,
        cancelLink : '/organisations',
        validationMessages: {},
        numberOfPages: ppauditData.totalNumberOfPages,
        page: pageNumber,
        totalNumberOfResults: ppauditData.totalNumberOfRecords
    });
};

module.exports = getppsyncStatus;
