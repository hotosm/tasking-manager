FROM python:3.8-alpine
LABEL version=0.1
LABEL maintainer="Yogesh Girikumar <yogesh.girikumar@hotosm.org>"
LABEL description="Builds backend docker image"

WORKDIR /usr/src/app

# ENV NEW_RELIC_LICENSE=""
#     POSTGRES_DB=""
#     POSTGRES_PASSWORD=""
#     POSTGRES_USER=""
#     TM_APP_BASE_URL=""
#     TM_ENVIRONMENT=""
#     TM_CONSUMER_KEY=""
#     TM_CONSUMER_SECRET=""
#     TM_SECRET=""
#     TM_SMTP_HOST=""
#     TM_SMTP_PORT=""
#     TM_SMTP_USER=""
#     TM_SMTP_PASSWORD=""
#     TM_DEFAULT_CHANGESET_COMMENT=""
#     TM_EMAIL_FROM_ADDRESS=""
#     TM_EMAIL_CONTACT_ADDRESS=""
#     TM_LOG_LEVEL=""
#     TM_LOG_DIR=""
#     TM_ORG_NAME=""
#     TM_ORG_CODE=""
#     TM_IMAGE_UPLOAD_API_URL=""
#     TM_IMAGE_UPLOAD_API_KEY=""

# Setup backend build dependencies
RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev libffi-dev geos-dev proj-util proj-dev make postgresql-libs geos proj-util

COPY backend backend/
COPY migrations migrations/
COPY scripts scripts/
COPY manage.py .

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


ENV TZ UTC # Fix timezone (do not change - see issue #3638)
EXPOSE 5000

ENV WORKERS 3
ENV THREADS 3
ENV TIMEOUT 179

#CMD ["sh", "-c", "exec gunicorn -b 0.0.0.0:5000 --worker-class gevent --workers $WORKERS --threads $THREADS --timeout $TIMEOUT manage:application"]
#CMD ["gunicorn", "-b", "0.0.0.0:5000", "--worker-class", "gevent", "--workers", $WORKERS, "--threads", $THREADS, "--timeout", $TIMEOUT, "manage:application"]
#CMD gunicorn --preload --bind=0.0.0.0:5000 --worker-class=gevent --workers=$WORKERS --threads=$THREADS --timeout=$TIMEOUT manage:application
EXPOSE 5000
CMD ["gunicorn", "-c", "python:backend.gunicorn", "manage:application"]
