# DomeGIS

Publishing platform for Arcgis Online maps

# Running

Clone this repository locally:

    git clone git@github.com:ecodigital/DomeGIS.git

Install VM:

    cd DomeGIS
    vagrant up

Install dependencies and run app:

    vagrant ssh
    cd /vagrant
    npm install
    npm start    

To load sample data, run:

    shp2pgsql -s 3857 -g the_geom samples/subprefectures-srid-3857.shp public.domegis | psql -U domegis -d domegis


## License

Copyright (c) 2015

Licensed under the [MIT license](LICENSE).
