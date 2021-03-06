#!/bin/sh -e

# Edit the following to change the name of the database user that will be created:
APP_DB_USER=domegis
APP_DB_PASS=domegis
APP_DB_READONLY_USER=domegis_readonly
APP_DB_READONLY_USER_PWD=domegis

# Edit the following to change the name of the database that is created (defaults to the user name)
APP_DB_NAME=$APP_DB_USER

# Edit the following to change the version of PostgreSQL that is installed
PG_VERSION=9.6

###########################################################
# Changes below this line are probably not necessary
###########################################################
print_db_usage () {
  echo "Your PostgreSQL database has been setup and can be accessed on your local machine on the forwarded port (default: 15432)"
  echo "  Host: localhost"
  echo "  Port: 15432"
  echo "  Database: $APP_DB_NAME"
  echo "  Username: $APP_DB_USER"
  echo "  Password: $APP_DB_PASS"
  echo ""
  echo "Admin access to postgres user via VM:"
  echo "  vagrant ssh"
  echo "  sudo su - postgres"
  echo ""
  echo "psql access to app database user via VM:"
  echo "  vagrant ssh"
  echo "  sudo su - postgres"
  echo "  PGUSER=$APP_DB_USER PGPASSWORD=$APP_DB_PASS psql -h localhost $APP_DB_NAME"
  echo ""
  echo "Env variable for application development:"
  echo "  DATABASE_URL=postgresql://$APP_DB_USER:$APP_DB_PASS@localhost:15432/$APP_DB_NAME"
  echo ""
  echo "Local command to access the database via psql:"
  echo "  PGUSER=$APP_DB_USER PGPASSWORD=$APP_DB_PASS psql -h localhost -p 15432 $APP_DB_NAME"
}

export DEBIAN_FRONTEND=noninteractive

PROVISIONED_ON=/etc/vm_provision_on_timestamp
if [ -f "$PROVISIONED_ON" ]
then
  echo "VM was already provisioned at: $(cat $PROVISIONED_ON)"
  echo "To run system updates manually login via 'vagrant ssh' and run 'apt-get update && apt-get upgrade'"
  echo ""
  print_db_usage
  exit
fi

PG_REPO_APT_SOURCE=/etc/apt/sources.list.d/pgdg.list
if [ ! -f "$PG_REPO_APT_SOURCE" ]
then
  # Add PG apt repo:
  echo "deb http://apt.postgresql.org/pub/repos/apt/ trusty-pgdg main" > "$PG_REPO_APT_SOURCE"

  # Add PGDG repo key:
  wget --quiet -O - https://apt.postgresql.org/pub/repos/apt/ACCC4CF8.asc | apt-key add -
fi

# Update package list and upgrade all packages
apt-get update
apt-get -y upgrade

apt-get -y install "postgresql-$PG_VERSION" "postgresql-contrib-$PG_VERSION" "postgresql-server-dev-$PG_VERSION" "postgresql-plpython-$PG_VERSION"

PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
PG_DIR="/var/lib/postgresql/$PG_VERSION/main"

# Edit postgresql.conf to change listen address to '*':
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"

# Append to pg_hba.conf to add password auth:
echo "local    all             all             trust" > "$PG_HBA"
echo "host    all             all             all                     md5" >> "$PG_HBA"

# Explicitly set default client_encoding
echo "client_encoding = utf8" >> "$PG_CONF"

# Restart so that all new config is loaded:
service postgresql restart

cat << EOF | su - postgres -c psql
-- Create the database user:
CREATE USER $APP_DB_USER WITH PASSWORD '$APP_DB_PASS';

-- Create the database:
CREATE DATABASE $APP_DB_NAME WITH OWNER=$APP_DB_USER
                                  LC_COLLATE='en_US.utf8'
                                  LC_CTYPE='en_US.utf8'
                                  ENCODING='UTF8'
                                  TEMPLATE=template0;

-- User domegis can add new SRIDs
GRANT ALL ON TABLE spatial_ref_sys TO $APP_DB_USER;

-- Create the database user:
CREATE USER $APP_DB_READONLY_USER WITH PASSWORD '$APP_DB_READONLY_USER_PWD';
GRANT CONNECT ON DATABASE $APP_DB_NAME TO $APP_DB_READONLY_USER;
GRANT USAGE ON SCHEMA public TO $APP_DB_READONLY_USER;

EOF

# Tag the provision time:
date > "$PROVISIONED_ON"

echo "Successfully created PostgreSQL dev virtual machine."
echo ""
print_db_usage

apt-get -y install software-properties-common
add-apt-repository ppa:ubuntugis/ppa

# install postgis
echo "Installing extensions..."
apt-get -y install "build-essential" "git" "gdal-bin" "zip" "postgis"

# install pg_schema_triggers
git clone https://github.com/CartoDB/pg_schema_triggers.git
cd pg_schema_triggers/
make
make install
cd ..

# CartoDB postgresql plugin
git clone https://github.com/CartoDB/cartodb-postgresql.git
cd cartodb-postgresql
make all install
cd ..

# Install extensions
sudo -u postgres psql -d domegis -c "CREATE EXTENSION postgis;"
sudo -u postgres psql -d domegis -c "CREATE EXTENSION schema_triggers;"
sudo -u postgres psql -d domegis -c "CREATE EXTENSION plpythonu;"
sudo -u postgres psql -d domegis -c "CREATE EXTENSION cartodb;"

# Install Node.js, Mapnik, Redis
curl -sL https://deb.nodesource.com/setup_0.10 | sudo -E bash -
apt-get install -y nodejs
apt-get install -y libmapnik2.2 redis-server node-node-redis
apt-get install -y libcairo2-dev libpango1.0-dev libjpeg8-dev libgif-dev

# Change to app directory
cd /vagrant

# Install Node.js dependencies
npm install

# Install Sequelize and migrate DB
npm install -g pg sequelize sequelize-cli@2.5.1
sequelize db:migrate

# Install Bower components
npm install -g bower
bower install --allow-root
