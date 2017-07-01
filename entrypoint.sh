#!/bin/bash
set -e

echo "Updating permissions..."
chown -R $APP_USER:$APP_USER /src

# wait for postgres to accept connections
sleep 10
until sequelize db:migrate; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 5
done

# allow the container to be started with `--user`
if [ "$1" = 'node' ] || [ "$1" = 'nodemon' ]; then
	exec gosu $APP_USER:$APP_USER "$@"
fi
exec "$@"
