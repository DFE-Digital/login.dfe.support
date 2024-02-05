const { sendResult } = require('../../infrastructure/utils');
const {organisation} = require('login.dfe.dao');
const rp = require('login.dfe.request-promise-retry');

const validateInput = async (req) => {
  const model = {
    emailStatus: req.body.emailStatus || '',
    validationMessages: {},
  };

  if (!model.emailStatus) {
    model.validationMessages.emailStatus = 'Confirm you have received the Provider Profile email';
  }
  return model;
};

const wsSyncCall = async () => {
  try {
    const client = await rp({
      method: 'GET',
      uri: `${process.env.START_WS__SYNC_URL}`
    });
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

//const syncPromise = () => new Promise(resolve =>
 //   setTimeout(() => resolve(wsSyncCall()), 3000)
//);

const postPpsyncStatus = async (req, res) => {
  const model = await validateInput(req);
  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    const ppauditData = await organisation.getPpAuditPaging(pageNumber);
    model.audits = ppauditData.audits;
    model.numberOfPages= ppauditData.totalNumberOfPages;
    model.page= pageNumber;
    model.totalNumberOfResults= ppauditData.totalNumberOfRecords;
    return sendResult(req, res, 'organisations/views/ppsyncStatus', model);
  }
  wsSyncCall();
  res.flash('info', 'The Provider Profile Sync is in progress');
  return res.redirect('/organisations');
};

module.exports = postPpsyncStatus;
