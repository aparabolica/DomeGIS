#!/bin/bash
set -e

# wait for postgres to accept connections
sleep 30
until sequelize db:migrate; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 30
done

# allow the container to be started with `--user`
if [ "$1" = 'node' ] || [ "$1" = 'nodemon' ]; then
	exec DEBUG=grainstore:* gosu $APP_USER:$APP_USER "$@"
fi
exec "$@"
