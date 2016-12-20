'use strict';

var app = require('./app');
var host = app.get('host');
var port = app.get('port');
var server = app.listen(port);

server.on('listening', function() {

  // catch unhandled global errors
  process.on('unhandledRejection', function(reason, p) {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
  });

  console.log('Feathers application started on ' + host + ':' + port);
});
