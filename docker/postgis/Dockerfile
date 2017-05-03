FROM mdillon/postgis:9.6

ENV POSTGRESQL_MAJOR 9.6
ENV CARTODB_POSTGRESQL_VERSION 0.18.5

RUN apt-get update \
      && apt-get install -y --no-install-recommends \
          build-essential \
          ca-certificates \
          git \
          postgresql-contrib-$POSTGRESQL_MAJOR \
          postgresql-server-dev-$POSTGRESQL_MAJOR \
          postgresql-plpython-$POSTGRESQL_MAJOR \
      && rm -rf /var/lib/apt/lists/*

# CartoDB Schema Triggers extension
WORKDIR /
RUN git clone https://github.com/CartoDB/pg_schema_triggers.git
WORKDIR /pg_schema_triggers
RUN make && make install

# CartoDB PostgreSQL Plugin
WORKDIR /
RUN git clone https://github.com/CartoDB/cartodb-postgresql.git
WORKDIR /cartodb-postgresql
RUN make && make install

RUN mkdir -p /docker-entrypoint-initdb.d
COPY setup-database.sh /docker-entrypoint-initdb.d/setup-database.sh
