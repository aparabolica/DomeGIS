'use strict';

var app = require('./app');
var host = app.get('host');
var port = app.get('port');
var server = app.listen(port);

server.on('listening', function() {
  console.log('Feathers application started on ' + host + ':' + port);
});
