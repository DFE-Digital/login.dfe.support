const passport = require("passport");
const { Strategy, Issuer, custom } = require("openid-client");
const asyncRetry = require("login.dfe.async-retry");
const Redis = require("ioredis");
const logger = require("../logger");
const config = require("../config");
const { getUserServiceRaw } = require("login.dfe.api-client/users");

// Dedicated connection to the OIDC Redis DB (DB 0, `dsi:` namespace) used
// solely to read the per-user deactivation kill switch written by the OIDC
// service when an admin deactivates a user.  This is intentionally separate
// from the session-store connection (DB 3) so a DB-index mismatch cannot
// silently skip the kill-switch check.
const oidcRedisConnString =
  process.env.LOCAL_REDIS_CONN || process.env.REDIS_CONN;
const oidcKillSwitchClient = new Redis(oidcRedisConnString, {
  tls: oidcRedisConnString?.includes("6380"),
  lazyConnect: true,
});

custom.setHttpOptionsDefaults({
  timeout: 10000,
});

const getPassportStrategy = async () => {
  const issuer = await asyncRetry(
    async () => await Issuer.discover(config.identifyingParty.url),
    asyncRetry.strategies.apiStrategy,
  );

  const client = new issuer.Client({
    client_id: config.identifyingParty.clientId,
    client_secret: config.identifyingParty.clientSecret,
  });
  if (
    config.identifyingParty.clockTolerance &&
    config.identifyingParty.clockTolerance > 0
  ) {
    client[custom.clock_tolerance] = config.identifyingParty.clockTolerance;
  }

  return new Strategy(
    {
      client,
      params: {
        redirect_uri: `${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}/auth/cb`,
        scope: "openid profile email",
      },
    },
    (tokenset, authUserInfo, done) => {
      client
        .userinfo(tokenset.access_token)
        .then((userInfo) => {
          userInfo.id = userInfo.sub;
          userInfo.name = userInfo.sub;
          userInfo.id_token = tokenset.id_token;
          Object.assign(userInfo, tokenset.claims());
          done(null, userInfo);
        })
        .catch((err) => {
          logger.error("getPassportStrategy", { error: { ...err } });
          done(err);
        });
    },
  );
};

const hasJwtExpired = (exp) => {
  if (!exp) {
    return true;
  }

  const expires = new Date(Date.UTC(1970, 0, 1) + exp * 1000).getTime();
  const now = Date.now();
  return expires < now;
};

const init = async (app) => {
  passport.use("oidc", await getPassportStrategy());
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Async deserializeUser: checks the OIDC kill switch before restoring the
  // session.  If the OIDC service has written `dsi:KillSwitch:{userId}` to
  // Redis (set during user deactivation), this returns null immediately,
  // causing Passport to treat the request as unauthenticated and redirecting
  // the user to re-authenticate — where the OIDC provider will deny access
  // because Account.findById returns null for deactivated users.
  //
  // The kill switch check fails OPEN: if Redis is unreachable or the key is
  // absent, we fall through to the normal expiry check so that a Redis hiccup
  // does not lock out legitimate users.
  passport.deserializeUser(async (user, done) => {
    try {
      if (hasJwtExpired(user.exp)) {
        return done(null, null);
      }

      const killSwitchKey = `dsi:KillSwitch:${user.sub.toLowerCase()}`;
      const isDeactivated = await oidcKillSwitchClient.get(killSwitchKey);
      if (isDeactivated) {
        logger.info(
          `Rejecting session for deactivated user ${user.sub} (kill switch active)`,
        );
        return done(null, null);
      }

      return done(null, user);
    } catch (err) {
      // Fail open: a Redis error must not lock out active users.
      logger.warn(
        `Kill switch check failed for user ${user.sub}, proceeding with session`,
        { error: err.message },
      );
      if (hasJwtExpired(user.exp)) {
        return done(null, null);
      }
      return done(null, user);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/auth", passport.authenticate("oidc"));
  app.get("/auth/cb", (req, res, next) => {
    const defaultLoggedInPath = "/";
    const correlationId = req.id;

    const checkSessionAndRedirect = () => {
      if (!req.session.redirectUrl.toLowerCase().endsWith("signout")) {
        return res.redirect("/not-authorised");
      }
    };

    if (req.query.error === "sessionexpired") {
      return res.redirect(defaultLoggedInPath);
    }
    passport.authenticate("oidc", async (err, user) => {
      let redirectUrl = defaultLoggedInPath;

      if (err) {
        if (err.message.match(/state\smismatch/)) {
          req.session = null;
          return res.redirect(defaultLoggedInPath);
        }
        logger.error(`Error in auth callback - ${err}`, { correlationId });
        return next(err);
      }
      if (!user) {
        return res.redirect("/");
      }

      const userDetails = {
        sub: user.sub,
        email: user.email,
        exp: user.exp,
        id_token: user.id_token,
      };

      let allUserServices;
      try {
        allUserServices = await getUserServiceRaw({
          userId: user.sub,
          serviceId: config.access.identifiers.service,
          organisationId: config.access.identifiers.organisation,
        });
      } catch (error) {
        logger.error("Login error in auth callback-allUserServices", {
          correlationId,
          error: { ...error },
        });
        checkSessionAndRedirect();
      }

      if (allUserServices && allUserServices.roles) {
        const roles = allUserServices.roles.sort((a, b) =>
          a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
        );
        const supportClaims = {
          isRequestApprover: roles.some((i) => i.code === "request_approver"),
          isSupportUser: roles.some((i) => i.code === "support_user"),
          isServiceCreator: roles.some((i) => i.code === "service_creator"),
        };

        if (!supportClaims || !supportClaims.isSupportUser) {
          checkSessionAndRedirect();
        } else {
          Object.assign(userDetails, supportClaims);
        }
      } else {
        logger.error(
          `Login error in auth callback - No services OR roles found for user ${user.sub}`,
          { correlationId },
        );
        checkSessionAndRedirect();
      }

      if (req.session.redirectUrl) {
        redirectUrl = req.session.redirectUrl;
        req.session.redirectUrl = null;
      }

      return req.logIn(userDetails, (loginErr) => {
        if (loginErr) {
          logger.error(`Login error in auth callback - ${loginErr}`, {
            correlationId,
          });
          return next(loginErr);
        }
        if (redirectUrl.endsWith("signout/complete")) redirectUrl = "/";
        return res.redirect(redirectUrl);
      });
    })(req, res, next);
  });
};

module.exports = {
  init,
};
