const { searchForDevices, getSearchDetailsForDeviceBySerialNumber, updateDeviceInSearch } = require('./../../infrastructure/search');
const devices = require('./../../infrastructure/devices');
const logger = require('./../../infrastructure/logger');
const { getUserLoginAuditsSince, getTokenAudits } = require('./../../infrastructure/audit');
const moment = require('moment');
const { deleteUserDevice } = require('./../../infrastructure/directories');

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;

  const criteria = paramsSource.criteria ? paramsSource.criteria.trim() : '';
  if (!criteria || criteria.length < 4) {
    return {
      validationMessages: {
        criteria: 'Please enter at least 4 characters'
      }
    };
  }

  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  let sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'serialNumber';
  let sortDir = (paramsSource.sortdir || 'asc').toLowerCase();

  const results = await searchForDevices(criteria + '*', page, sortBy, sortDir);
  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for user devices in support using criteria "${criteria}"`, {
    type: 'support',
    subType: 'userDevice-search',
    userId: req.user.sub,
    userEmail: req.user.email,
    criteria: criteria,
    pageNumber: page,
    numberOfPages: results.numberOfPages,
    sortedBy: sortBy,
    sortDirection: sortDir,
  });

  return {
    criteria,
    page,
    sortBy,
    sortOrder: sortDir,
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    userDevices: results.userDevices,
    sort: {
      serialNumber: {
        nextDirection: sortBy === 'serialnumber' ? sortDir : 'asc',
        applied: sortBy === 'serialnumber',
      },
      organisation: {
        nextDirection: sortBy === 'organisation' ? sortDir : 'asc',
        applied: sortBy === 'organisation',
      },
      name: {
        nextDirection: sortBy === 'name' ? sortDir : 'asc',
        applied: sortBy === 'name',
      },
      status: {
        nextDirection: sortBy === 'status' ? sortDir : 'asc',
        applied: sortBy === 'status',
      },
      lastLogin: {
        nextDirection: sortBy === 'lastlogin' ? sortDir : 'asc',
        applied: sortBy === 'lastlogin',
      },
    }
  };
};

const getUserTokenDetails = async (req, params) => {
  const serialNumber = params.serialNumber;
  const correlationId = req.id;

  const result = await getSearchDetailsForDeviceBySerialNumber(serialNumber, correlationId);
  if (!result) {
    return undefined;
  }
  const uid = result.id;

  let successfulLogins = [];
  if(uid) {
    const logins = (await getUserLoginAuditsSince(uid, moment().subtract(1, 'years').toDate())).map(x => {
      x.timestamp = new Date(x.timestamp);
      return x;
    });
    successfulLogins = logins.filter(x => x.success).sort((x, y) => {
      const xTime = x.timestamp.getTime();
      const yTime = y.timestamp.getTime();
      if (xTime > yTime) {
        return -1;
      }
      if (xTime < yTime) {
        return 1;
      }
      return 0;
    });
  }

  const pageNumber = req.query && req.query.page ? parseInt(req.query.page) : 1;
  if (isNaN(pageNumber)) {
    return null;
  }

  let auditRecords = [];
  if (result) {
    auditRecords = await getTokenAudits(uid, serialNumber, pageNumber, result.name);
  }

  logger.audit(`${req.user.email} (id: ${req.user.sub}) viewed users device userId:${uid} ${req.user.email} in support`, {
    type: 'support',
    subType: 'userDevice-detail',
    userId: req.user.sub,
    userEmail: req.user.email,
  });

  if (result) {
    return {
      uid: uid,
      name: result.name,
      serialNumber: result.device.serialNumber,
      serialNumberFormatted: result.device.serialNumberFormatted,
      tokenStatus: result.device.status,
      orgName: result.organisation ? result.organisation.name : '',
      email: result.email,
      lastLogin: successfulLogins && successfulLogins.length > 0 ? successfulLogins[0].timestamp : null,
      numberOfSuccessfulLoginAttemptsInTwelveMonths: successfulLogins ? successfulLogins.length : 0,
      audit: auditRecords ? auditRecords : { audits: [] },
      page: pageNumber,
      totalNumberOfResults: auditRecords.numberOfRecords,
      numberOfPages: auditRecords.numberOfPages,
    };
  }

  return {
    uid: uid,
    name: '',
    serialNumber: serialNumber,
    serialNumberFormatted: `${serialNumber.substr(0, 2)}-${serialNumber.substr(2, 7)}-${serialNumber.substr(9, 1)}`,
    tokenStatus: 'Unassigned',
    orgName: '',
    email: '',
    lastLogin: null,
    numberOfSuccessfulLoginAttemptsInTwelveMonths: 0,
    audit: { audits: [] },
    page: 1,
    totalNumberOfResults: 0,
    numberOfPages: 0,
  };
};

const validateResyncCodes = (code1, code2) => {
  const messages = {
    code1: '',
    code2: '',
  };

  const codeValidation = (code, codeName) => {
    if (!code) {
      return `You must provide ${codeName} code`;
    }
    if (isNaN(parseInt(code))) {
      return `${codeName} code must be a number`;
    }
    if (code.length !== 8) {
      return `${codeName} code must be 8 digits long`;
    }
    return null;
  };

  messages.code1 = codeValidation(code1, 'first');
  messages.code2 = codeValidation(code2, 'second');

  const failed = messages.code1 || messages.code2;

  return {
    failed,
    messages,
  };
};

const resyncToken = async (req) => {
  const serialNumber = req.body.serialNumber;
  const code1 = req.body.code1;
  const code2 = req.body.code2;

  const validationResult = validateResyncCodes(code1, code2);

  if (validationResult.failed) {
    return {
      validationResult,
      resyncResult: false,
    }
  }

  const resyncResult = await devices.syncDigipassToken(serialNumber, code1, code2);

  if (!resyncResult) {
    validationResult.messages.syncError = 'The codes you entered are not correct';
    logger.audit(`${req.user.email} (id: ${req.user.sub}) failed to resync token "${serialNumber}"`, {
      type: 'support',
      subType: 'digipass-resync',
      success: false,
      editedUser: req.body.uid,
      userId: req.user.sub,
      userEmail: req.user.email,
      deviceSerialNumber: serialNumber,
    });
  } else {
    logger.audit(`${req.user.email} (id: ${req.user.sub}) did a token resync "${serialNumber}"`, {
      type: 'support',
      subType: 'digipass-resync',
      success: true,
      editedUser: req.body.uid,
      userId: req.user.sub,
      userEmail: req.user.email,
      deviceSerialNumber: serialNumber,
    });
  }

  return {
    validationResult,
    resyncResult,
  };
};

const unlockToken = async (req) => {

  const unlockType = req.body.tokenCode;
  const serialNumber = req.body.serialNumber;

  if (!unlockType) {
    return {
      success: false,
      validationResult: {
        failed: true,
        messages: {
          unlockCode: 'Please select an option'
        }
      }
    }
  }


  if (unlockType.toLowerCase() === 'disabled') {
    return {
      success: false,
      redirectToDeactivate: true,
      validationResult: {
        failed: true,
        messages: {}
      }
    }
  }

  const unlockResult = await devices.getDeviceUnlockCode(serialNumber, unlockType, req.id);


  logger.audit(`${req.user.email} (id: ${req.user.sub}) Requested a token unlock "${serialNumber}" with unlock code: "${unlockType}"`, {
    type: 'support',
    subType: 'digipass-unlock',
    success: unlockResult !== undefined,
    editedUser: req.body.uid,
    userId: req.user.sub,
    userEmail: req.user.email,
    deviceSerialNumber: serialNumber,
    unlockType: unlockType,
  });

  if (unlockResult === undefined) {
    return {
      success: false,
      validationResult: {
        failed: true,
        messages: {
          unlockCode: 'Unable to get unlock code for device',
        },
      },
    };
  }

  return {
    success: true,
    unlockCode: unlockResult,
  }
};

const deactivateToken = async (req) => {
  const uid = req.params.uid;
  const serialNumber = req.params.serialNumber;
  const reason = req.body.reason;
  const correlationId = req.id;

  let removeResult = {
    success: false
  };
  const result = await devices.deactivateToken(serialNumber, reason, correlationId);

  if (result) {
    removeResult = await deleteUserDevice(uid, serialNumber, correlationId);
  }

  if (!result && !removeResult.success) {
    logger.audit(`${req.user.email} (id: ${req.user.sub}) Failed to deactivate token with serial number "${serialNumber}"`, {
      type: 'support',
      subType: 'digipass-deactivate',
      success: false,
      editedUser: uid,
      userId: req.user.sub,
      userEmail: req.user.email,
      deviceSerialNumber: serialNumber,
    });
  } else {
    const result = await getSearchDetailsForDeviceBySerialNumber(serialNumber, correlationId);
    result.device.status = 'Deactivated';
    result.id = null;
    result.name = null;
    result.organisation = null;
    await updateDeviceInSearch(result, correlationId);

    logger.audit(`${req.user.email} (id: ${req.user.sub}) Deactivated token with serial number "${serialNumber}"`, {
      type: 'support',
      subType: 'digipass-deactivate',
      success: true,
      editedUser: uid,
      userId: req.user.sub,
      userEmail: req.user.email,
      deviceSerialNumber: serialNumber,
    });
  }

  return result;

};

module.exports = {
  search,
  getUserTokenDetails,
  resyncToken,
  unlockToken,
  deactivateToken,
};
