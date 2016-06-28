# DomeGIS

Publishing platform for Arcgis Online maps

# Running

Clone this repository locally:

    git clone git@github.com:ecodigital/DomeGIS.git

Install VM:

    cd DomeGIS
    vagrant up

The `config` directory contains the following files, which shouldn't be changed unless you need so:

- `config.json`: db connection for Sequelize migrations;
- `default.json`: PostgreSQL, Windshaft and other platform configs.

Install dependencies, migrate database and run app:

    vagrant ssh
    cd /vagrant
    sequelize db:migrate    
    npm install
    npm start    

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
