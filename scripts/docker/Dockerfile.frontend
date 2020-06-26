FROM alpine/git as base

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Get the Tasking Manager
ARG branch=master
RUN git clone --depth=1 git://github.com/hotosm/tasking-manager.git \
	--branch $branch /usr/src/app

RUN rm -rf backend/ migrations/

FROM tiangolo/node-frontend:10 as build

WORKDIR /usr/src/app

COPY --from=base /usr/src/app/frontend /usr/src/app

## SETUP
RUN npm install

ARG TM_APP_API_URL=http://localhost/api

# SERVE
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY --from=build /nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]