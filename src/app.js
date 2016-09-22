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
var assets = require('connect-assets');
var socketio = require('feathers-socketio');
var middleware = require('./middleware');
var services = require('./services');

var app = feathers();

app.configure(configuration(path.join(__dirname, '..')));

app
  .use(compress())
  .engine('html', require('ejs').renderFile)
  .options('*', cors())
  .use(cors())
  .use(favicon( path.join(app.get('public'), 'favicon.ico') ))
  .use('/', serveStatic( app.get('public') ))
  .use('/components', serveStatic( 'bower_components', {maxAge: 31536000} ))
  .use('/styles', require('express-less')( 'public/styles', {compress: true}))
  .use('/assets', serveStatic('builtAssets', {maxAge: 31536000}))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .set('view engine', 'ejs')
  .set('views', 'public')
  .configure(function() {
    var app = this;
    app.use(assets({
      paths: [
        'public/js',
        'public/lib',
        'bower_components'
      ]
    }));
  })
  .configure(hooks())
  .configure(rest())
  .configure(socketio())
  .configure(function() {
    var app = this;

    // index route
    app.get('/', function(req, res) {
      res.render('index');
    });

    // settings route
    app.get('/settings', function(req, res){
      var settings = {
        host: process.env.HOST || app.get('host'),
        port: process.env.PORT || app.get('port'),
        tiles: app.get('tiles')        
      }
      res.json(settings);
    });
  })
  .configure(services)
  .configure(middleware);

module.exports = app;
