#!/bin/bash
set -e

# wait for postgres to accept connections
until sequelize db:migrate; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

# migrate database


# allow the container to be started with `--user`
if [ "$1" = 'node' ] || [ "$1" = 'nodemon' ]; then
	exec gosu $APP_USER:$APP_USER "$@"
fi
exec "$@"
