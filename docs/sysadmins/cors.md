# CORS

With the version 5, we’re taking small, deliberate steps towards OWASP standards and tightening up our CORS policy
was done as one of those “tiny steps”. It’s not meant to be a hurdle for developers but rather a browser‑based
safeguard that helps prevent cross‑site request forgery and other attacks at end user's that could silently exfiltrate
a user’s credentials or data.

**Where the setting lives**

* CORS is controlled by the `EXTRA_CORS_ORIGINS` environment variable in the app config. If it is **not** set, all origins are allowed by default.
* `http://localhost:3000` is already whitelisted on the staging and dev API instances (`https://tasking-manager-staging-api.hotosm.org/api/docs` and `https://tasking-manager-dev-api.hotosm.org/api/docs`) so you can develop locally without CORS errors.
* If a production frontend needs direct browser access, contact the system admin (support) to request the exact origin be added to the whitelist.

* For any browser‑based clients calling the TM API directly are now blocked by the CORS.
For any production frontends running that want direct access to the TM API in-browser,
we can also allow them by adding to our whitelist for which the admins can be contacted
and the origin can be whitelisted. Please feel free to contact the system admin via the support section
if any whitelisting necesssary.

---

## Local development options

### 1) Local nginx reverse-proxy

* **What:** Run a tiny nginx container that forwards requests to the TM API and injects permissive CORS headers for your browser.
* **Advantages:** Easy to run (single container), works for any client, replicates production TLS/host header behaviour, can be shared among a team.
* **Disadvantages / cautions:** Bypasses browser protections — **do not** expose publicly or use in production. If you need credentials (cookies) set explicit `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials` instead of `*`.

**Minimal nginx.conf (development only)**

```nginx
http {
  server { listen 80; location / {
    proxy_pass https://tasking-manager-production-api.hotosm.org/;
    if ($request_method = OPTIONS) {
      add_header 'Access-Control-Allow-Origin' '*' always;
      add_header 'Access-Control-Allow-Methods' 'GET,POST,PUT,PATCH,DELETE,OPTIONS' always;
      add_header 'Access-Control-Allow-Headers' 'Content-Type,Authorization' always;
      return 204;
    }
    add_header 'Access-Control-Allow-Origin' '*' always;
  }}
}
```

**Run:**

```bash
docker run -d --name cors-proxy -p 8080:80 \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

Access via `http://localhost:8080`.

### 2) Cloudflare Worker proxy

* See `kshitijrajsharma/tm-cors-proxy` a ready-made Cloudflare Worker proxy implementation that forwards browser requests to the TM API and injects CORS headers.

---
