# DomeGIS

Publishing platform for Arcgis Online maps

# Running

Clone this repository locally:

    git clone git@github.com:ecodigital/DomeGIS.git

Install VM:

    cd DomeGIS
    vagrant up

The `config` directory contains the following files:

- `config.json`: db connection for Sequelize migrations;
- `default.json`: PostgreSQL, Windshaft and other platform configs.

For production environments, set `NODE_ENV=production`. If you want to override any default config options, create a `config/production.json` based on ` config/default.json`. Some config options can be defined also as environment variables:

- `NODE_ENV`: `development` (default), `staging`, `test`, `production`;
- `HOST`: site hostname (default: `localhost`);
- `PORT`: server port (default: `3030`);
- `SUBDOMAINS`: available subdomains, useful for tile requests (default: `a,b,c`).

Access the machine via SSH:

  vagrant ssh

Install dependencies and migrate database:

    cd /vagrant
    npm install
    bower install
    sequelize db:migrate

Then start the application:

    npm start

## API

DomeGIS uses [FeathersJS](http://feathersjs.com) as its web application framework, which exposes a [RESTful interface](http://docs.feathersjs.com/rest/readme.html).

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
