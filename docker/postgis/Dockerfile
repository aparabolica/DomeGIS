FROM mdillon/postgis:9.6

ENV POSTGRESQL_MAJOR 9.6
ENV CARTODB_POSTGRESQL_VERSION 0.18.5

RUN apt-get update \
      && apt-get install -y --no-install-recommends \
          build-essential \
          # software-properties-common \
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


COPY update-extensions.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
