#!/bin/sh

set -e

# Perform all actions as $POSTGRES_USER
export POSTGRES_DB="$POSTGRES_DB"

# Load PostGIS into both template_database and $POSTGRES_DB
for DB in "$POSTGRES_DB"; do
	echo "Loading Carto extensions into $DB"
	"${psql[@]}" --dbname="$DB" <<-'EOSQL'
    CREATE USER domegis_readonly WITH PASSWORD 'domegis';
    GRANT CONNECT ON DATABASE domegis TO domegis;
    GRANT USAGE ON SCHEMA public TO domegis;
EOSQL
done
