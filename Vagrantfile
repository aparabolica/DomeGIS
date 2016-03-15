# -*- mode: ruby -*-
# vi: set ft=ruby :

$dependencies = <<SCRIPT
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y build-essential git

  # PostGIS
  sudo add-apt-repository "deb http://apt.postgresql.org/pub/repos/apt/ trusty-pgdg main"
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
  apt-get update
  apt-get install -y postgresql postgresql-contrib postgis postgresql-server-dev-all postgresql-plpython-9.5

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

  # Configure PostgreSQL
  sudo -u postgres createuser -d vagrant
  sudo -u vagrant createdb domegis
  sudo -u postgres psql -d domegis -c "CREATE EXTENSION postgis;"
  sudo -u postgres psql -d domegis -c "CREATE EXTENSION schema_triggers;"
  sudo -u postgres psql -d domegis -c "CREATE EXTENSION plpythonu;"
  sudo -u postgres psql -d domegis -c "CREATE EXTENSION cartodb;"

  # Windshaft dependencies
  apt-get install -y nodejs npm
  update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10
  apt-get install -y libmapnik2.2 redis-server node-node-redis
  apt-get install -y libcairo2-dev libpango1.0-dev libjpeg8-dev libgif-dev

  # Meteor
  # curl https://install.meteor.com/ | sh

  # Download sample data
  git clone https://github.com/hacklabr/camadas-cti.git
  cd camadas-cti
  shp2pgsql -W "Latin1" Unidades_conservacao.shp public.unidades | psql -d domegis -U vagrant

SCRIPT

Vagrant.configure(2) do |config|

  # Ubuntu 14.04
  config.vm.box = 'ubuntu/trusty64'

  # Set memory and cpus
  config.vm.provider "virtualbox" do |v|
    v.memory = 2048
    v.cpus = 2
  end

  # Enable cache for dependencies packages
  if Vagrant.has_plugin?("vagrant-cachier")
    config.cache.scope = :box
  end

  config.vm.provision "shell", inline: $dependencies

  config.vm.network :forwarded_port, host: 4000, guest: 4000

end
