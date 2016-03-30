'use strict';

const path = require('path');
const serveStatic = require('feathers').static;
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const bodyParser = require('body-parser');
const socketio = require('feathers-socketio');
const middleware = require('./middleware');
const services = require('./services');

const app = feathers();

app.configure(configuration(path.join(__dirname, '..')));

app.use(compress())
  .options('*', cors())
  .use(cors())
  .use(favicon( path.join(app.get('public'), 'favicon.ico') ))
  .use('/', serveStatic( app.get('public') ))
  .use('/assets', serveStatic( 'bower_components' ))
  .use('/styles', require('express-less')( 'public/styles', {compress: true}))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(hooks())
  .configure(rest())
  .configure(socketio())
  .configure(services)
  .configure(middleware);

app.use('/dummy', {
  get: function(req, res) {
    res.send('dummy');
  }
});

global.environment = require('./tiler/config');

require('./tiler')(app, {
  base_url: '/database/:dbname/table/:table',
  base_url_mapconfig: '/database/:dbname/layergroup',
  grainstore: {
    datasource: {
      user:'domegis',
      host: '/var/run/postgresql',
      port: 5432,
      geometry_field: 'the_geom'
    }
  },
  redis: {host: '127.0.0.1', port: 6379},
  enable_cors: true,
  req2params: function(req, callback){

    req.params.dbuser = 'domegis';
    req.params.dbname = 'domegis';
    req.params.dbpassword = 'domegis';

    // this is in case you want to test sql parameters eg ...png?sql=select * from my_table limit 10
    req.params =  _.extend({}, req.params);
    _.extend(req.params, req.query);

    // send the finished req object on
    callback(null,req);

  }

});

module.exports = app;
