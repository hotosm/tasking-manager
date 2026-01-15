# Traefik v3 Upgrade

As of [issue #7080](https://github.com/hotosm/tasking-manager/issues/7080), the Tasking Manager has upgraded from Traefik v2.10 to v3.6.1. This provides better performance and security updates. Most users won't need to change anything, but if you're running legacy Docker systems and encounter issues, you can revert to v2.10.

## What changed

The `docker-compose.yml` now uses Traefik v3.6.1 and explicitly disables Traefik routing for the database:
```yaml
traefik:
  image: traefik:v3.6.1  # Previously v2.10

tm-db:
  labels:
    - "traefik.enable=false"  # New: prevents routing to database
```

## Compatibility

- **Docker Engine**: 20.10.0 or newer recommended
- **Docker Compose**: v2.0.0 or newer recommended
- Default is now **Traefik v3.6.1**

---

## Reverting to Traefik v2.10 (legacy systems)

If you're running older Docker environments and experience issues with Traefik v3, you can revert to v2.10.

### Step 1: Update docker-compose.yml

Change the Traefik image version:
```yaml
traefik:
  image: traefik:v2.10  # Downgrade from v3.6.1
  restart: always
  ports:
    - "${TM_DEV_PORT:-3000}:80"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  command:
    - --entrypoints.web.address=:80
    - --providers.docker=true
  networks:
    - tm-net
```

### Step 2: Restart services
```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

The `traefik.enable=false` label on `tm-db` is optional for v2.10 but recommended for clarity.

---

## When to use v2.10

- Running Docker Engine older than 20.10
- Systems that cannot be upgraded
- Experiencing compatibility issues with v3

## Getting help

If issues persist:

1. Check versions:
```bash
   docker --version
   docker-compose --version
```

2. Check Traefik logs:
```bash
   docker-compose logs traefik
```

3. Open an issue at [hotosm/tasking-manager](https://github.com/hotosm/tasking-manager/issues) with your Docker version and relevant logs.

---

## Additional resources

- [Traefik v3 Documentation](https://doc.traefik.io/traefik/)
- [Traefik v2 to v3 Migration Guide](https://doc.traefik.io/traefik/migration/v2-to-v3/)
