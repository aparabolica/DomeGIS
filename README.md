# DomeGIS

Publishing platform for Arcgis Online maps

# Running

Clone this repository locally:

    git clone git@github.com:ecodigital/DomeGIS.git

Install VM:

    cd DomeGIS
    vagrant up

Access VM shell and install NVM:

    vagrant ssh
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
    exit

Install Node.js and dependencies:

    vagrant ssh
    cd /vagrant
    nvm install # install node 0.10, defined at .nvmrc
    npm install -g npm@1  # install
    npm install


    npm start

To load sample data, run:

    shp2pgsql -s 3857 -g the_geom samples/subprefectures-srid-3857.shp public.domegis | psql -U domegis -d domegis


## License

Copyright (c) 2015

Licensed under the [MIT license](LICENSE).
