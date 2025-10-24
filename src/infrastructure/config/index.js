const fs = require('fs');
const os = require('os');
const path = require('path');

require('dotenv').config();

const config = {
  loggerSettings: {
    logLevel: "debug",
    applicationName: "SupportConsole",
    auditDb: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ADT,
      password: process.env.SVC_SIGNIN_ADT_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_AUDIT_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  hostingEnvironment: {
    useDevViews: false,
    env: process.env.LOCAL_ENV || "azure",
    host: process.env.LOCAL_HOST || process.env.STANDALONE_SUPPORT_HOST_NAME,
    port: process.env.LOCAL_PORT_SUPPORT || 443,
    sslCert: process.env.LOCAL_SSL_CERT ? process.env.LOCAL_SSL_CERT.replace(/\\n/g, '\n') : "",
    sslKey: process.env.LOCAL_SSL_KEY ? process.env.LOCAL_SSL_KEY.replace(/\\n/g, '\n') : "",
    protocol: "https",
    hstsMaxAge: 86400,
    applicationInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    sessionSecret: process.env.SESSION_ENCRYPTION_SECRET_SUP,
    sessionCookieExpiryInMinutes: 480,
    gaTrackingId: process.env.GOOGLE_ANALYTICS_ID,
    accessibilityStatementUrl: process.env.ACCESSIBILITY_STATEMENT_URL,
    profileUrl: "https://" + process.env.STANDALONE_PROFILE_HOST_NAME,
    interactionsUrl: "https://" + process.env.STANDALONE_INTERACTIONS_HOST_NAME,
    helpUrl: "https://" + process.env.STANDALONE_HELP_HOST_NAME,
    servicesUrl: "https://" + process.env.STANDALONE_SERVICES_HOST_NAME,
    agentKeepAlive: {
      maxSockets: 30,
      maxFreeSockets: 10,
      timeout: 60000,
      keepAliveTimeout: 30000
    }
  },
  identifyingParty: {
    url: "https://" + process.env.STANDALONE_OIDC_HOST_NAME,
    clientId: "support",
    clientSecret: "support",
    clockTolerance: 300
  },
  adapter: {
    type: "sequelize",
    directories: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_DIR,
      password: process.env.SVC_SIGNIN_DIR_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_DIRECTORIES_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    organisation: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ORG,
      password: process.env.SVC_SIGNIN_ORG_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_ORGANISATIONS_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  cache: {
    type: "azuresearch",
    params: {
      serviceName: process.env.AZURE_SEARCH_NAME,
      apiKey: process.env.AZURE_SEARCH_API_KEY,
      indexPointerConnectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/3" : process.env.REDIS_CONN + "/3?tls=true"
    }
  },
  claims: {
    type: "redis",
    params: {
      connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/3" : process.env.REDIS_CONN + "/3?tls=true"
    }
  },
  directories: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_DIRECTORIES_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  organisations: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_ORGANISATIONS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  audit: {
    type: "sequelize",
    params: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ADT,
      password: process.env.SVC_SIGNIN_ADT_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_AUDIT_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 15,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    cacheConnectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/7" : process.env.REDIS_CONN + "/7?tls=true"
  },
  serviceMapping: {
    type: "redis",
    params: {
      connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/3" : process.env.REDIS_CONN + "/3?tls=true"
    },
    key2SuccessServiceId: process.env.SUCC_SVC_ID
  },
  applications: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_APPLICATIONS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  access: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_ACCESS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    },
    identifiers: {
      service: process.env.IDENTIFIER_SUPPORT_SVC_ID,
      organisation: process.env.IDENTIFIER_SUPPORT_ORG_ID,
      departmentForEducation: process.env.IDENTIFIER_SUPPORT_DFE_ID,
      manageService: process.env.IDENTIFIER_MANAGE_SERVICE
    }
  },
  search: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_SEARCH_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  toggles: {
    useGenericAddUser: true
  },
  notifications: {
    connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/4" : process.env.REDIS_CONN + "/4?tls=true"
  },
  assets: {
    url: process.env.CDN_HOST_NAME,
    version: process.env.CDN_ASSETS_VERSION
  },
  entra: {
    useEntraForAccountRegistration: process.env.ENTRA_USE_FOR_ACCOUNT_REGISTRATION?.toLowerCase() === 'true',
    cloudInstance: process.env.ENTRA_CLOUD_INSTANCE,
    tenantId: process.env.ENTRA_TENANT_ID,
    clientId: process.env.DFE_SIGNIN_HYBRID_INTEGRATION_APP_CLIENT_ID,
    clientSecret: process.env.DFE_SIGNIN_HYBRID_INTEGRATION_APP_SECRET,
    graphEndpoint: process.env.ENTRA_GRAPH_ENDPOINT
  }
}


// Persist configuration to a temporary file and then point the `settings` environment
// variable to the path of the temporary file. The `login.dfe.dao` package can then load
// this configuration.
function mimicLegacySettings(config) {
  // TODO: This can be improved by refactoring the `login.dfe.dao` package.
  const tempDirectoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'config-'));
  const tempConfigFilePath = path.join(tempDirectoryPath, 'config.json');

  fs.writeFileSync(tempConfigFilePath, JSON.stringify(config), { encoding: 'utf8' });
  process.env.settings = tempConfigFilePath;
}

mimicLegacySettings(config);

module.exports = config;
