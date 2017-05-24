#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --dbname="$POSTGRES_DB" --username "$POSTGRES_USER" <<-EOSQL
  CREATE USER domegis_readonly WITH PASSWORD 'domegis';
  GRANT CONNECT ON DATABASE domegis TO domegis;
  GRANT USAGE ON SCHEMA public TO domegis;

  CREATE EXTENSION schema_triggers;
  CREATE EXTENSION plpythonu;
  CREATE EXTENSION cartodb;
EOSQL
