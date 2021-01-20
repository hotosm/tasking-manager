import os

bind = "0.0.0.0:5000"
worker_class = "gevent"
workers = (os.cpu_count() or 1) * 2 + 1
threads = (os.cpu_count() or 1) * 2 + 1
preload = True
timeout = 180
