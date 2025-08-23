With the version 5, we’re taking small, deliberate steps towards OWASP standards and tightening up our CORS policy
was done as one of those “tiny steps”. It’s not meant to be a hurdle for developers but rather a browser‑based
safeguard that helps prevent cross‑site request forgery and other attacks at end user's that could silently exfiltrate
a user’s credentials or data.

The cors setting for the application can be found on config which is handled by the EXTRA_CORS_ORIGINS variable.
If this is not set in the environment, by default all the origins are allowed.

For ease of development, we already whitelist http://localhost:3000 on both our staging
https://tasking-manager-staging-api.hotosm.org/api/docs and dev https://tasking-manager-dev-api.hotosm.org/api/docs
instances, so you can work locally without running into CORS errors.

For any browser‑based clients calling the TM API directly are now blocked by the CORS.
For any production frontends running that want direct access to the TM API in-browser,
we can also allow them by adding to our whitelist for which the admins can be contacted
and the origin can be whitelisted. Please feel free to contact the system admin via the support section
if any whitelisting necesssary.
