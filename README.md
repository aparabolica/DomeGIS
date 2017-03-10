# DomeGIS

> Map publishing platform

## Install

Clone this repository locally, install Vagrant and run `vagrant up` inside the repository base directory.

If you have a Ubuntu environment, its possible to install the dependencies by running `./Vagrant-setup/bootstrap.sh` via terminal, but it can cause conflicts with other installed packages.

## Dependencies

DomeGIS uses [Carto's fork of node-mapnik](https://github.com/mapnik/node-mapnik) ([lastest releases](https://github.com/CartoDB/node-mapnik/releases)), a requirement of Windshaft module. 

## Migrate the database

We use Sequelize to handle models and migrations in PostgreSQL. To migrate a database, run:

    sequelize db:migrate

You can set database credentials at `config/config.json`.

## Configuration

The `config` directory contains the following files:

- `config.json`: db connection for Sequelize migrations;
- `default.json`: PostgreSQL, Windshaft and other platform configs.

For production environments, set `NODE_ENV=production`. If you want to override any default config options, create a `config/production.json` based on ` config/default.json`. Some config options can be defined also as environment variables:

- `NODE_ENV`: `development` (default), `staging`, `test`, `production`;
- `HOST`: site hostname (default: `localhost`);
- `PORT`: server port (default: `3030`);
- `SUBDOMAINS`: available subdomains, useful for tile requests (default: `a,b,c`).

## Running tests

We use Mocha as test suite, use the following command to run all tests:

    npm test

You can specify an expression to run only a limited set of tests. For example, the command bellow test the `maps` service:

    npm test -- -g "maps"

This application is based on [FeathersJS](http://feathersjs.com) framework, you can check the documentation [here](http://docs.feathersjs.com/).

## License

[MIT](LICENSE)

## Authors

This project is maintained by [Miguel Peixe](https://github.com/miguelpeixe) and [Vitor George](https://github.com/vgeorge).

Please check the [list of contributors](https://github.com/ecodigital/DomeGIS/graphs/contributors) on Github.
