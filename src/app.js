'use strict';

var path = require('path');
var serveStatic = require('feathers').static;
var favicon = require('serve-favicon');
var compress = require('compression');
var cors = require('cors');
var feathers = require('feathers');
var configuration = require('feathers-configuration');
var hooks = require('feathers-hooks');
var rest = require('feathers-rest');
var bodyParser = require('body-parser');
var socketio = require('feathers-socketio');
var middleware = require('./middleware');
var services = require('./services');

var app = feathers();

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

module.exports = app;
