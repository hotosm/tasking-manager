import os

bind = os.environ.get("GUNICORN_BIND", "0.0.0.0:5000")
worker_class = os.environ.get("GUNICORN_WORKER_CLASS" ,"uvicorn.workers.UvicornWorker")

# Number of worker processes
workers = int(os.environ.get("GUNICORN_WORKER_COUNT", (os.cpu_count() or 1) * 4 + 1))

# asgi asyncio recommended to use 1 thread per worker refer: FASTAPI Doc
threads = int(os.environ.get("GUNICORN_THREAD_COUNT", 1))

# Preload the application code before forking worker processes
preload_app = bool(os.environ.get("GUNICORN_PRELOAD_APP", True))

# Request timeout in seconds
timeout = int(os.environ.get("GUNICORN_TIMEOUT", 180))

max_requests = int(os.environ.get("GUNICORN_MAX_REQUESTS", 1000))
max_requests_jitter = int(os.environ.get("GUNICORN_MAX_REQUESTS_JITTER", 50)) # To prevent all workers restarting at once
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", 120))
keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", 5))
