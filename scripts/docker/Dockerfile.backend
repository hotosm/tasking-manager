FROM python:3.7-alpine as base
WORKDIR /usr/src/app

## BUILD
FROM base as builder

# Setup backend build dependencies
RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev libffi-dev geos-dev proj-util proj-dev make

# Setup backend Python dependencies
COPY requirements.txt .
RUN pip install --prefix=/install --no-warn-script-location -r requirements.txt

## DEPLOY
FROM base

# Setup backend runtime dependencies
RUN apk update && apk add postgresql-libs geos proj-util

COPY --from=builder /install /usr/local
COPY . .

ENV TZ UTC # Fix timezone (do not change - see issue #3638)
EXPOSE 5000

ENV WORKERS 3
ENV THREADS 3
ENV TIMEOUT 179

CMD ["sh", "-c", "exec gunicorn -b 0.0.0.0:5000 --worker-class gevent --workers $WORKERS --threads $THREADS --timeout $TIMEOUT manage:application"]
