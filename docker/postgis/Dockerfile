FROM mdillon/postgis:9.6

ENV POSTGRESQL_MAJOR 9.6
ENV CARTODB_POSTGRESQL_VERSION 0.18.5

RUN mkdir -p /docker-entrypoint-initdb.d
COPY setup-database.sh /docker-entrypoint-initdb.d/setup-database.sh
