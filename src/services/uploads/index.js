'use strict';

// feathers-blob service
var blobService = require('feathers-blob');
var fs = require('fs-blob-store');
var blobStorage = fs(__dirname + '/../../../uploads');

// multi-part middleware
var multer = require('multer');
var multipartMiddleware = multer();

// hooks
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  app.use('/uploads',
    multipartMiddleware.single('file'),
    function (req,res,next){
      req.feathers.file = req.file;
      next();
    },
    blobService({Model: blobStorage})
  );

  // Get our initialize service to that we can bind hooks
  var uploadService = app.service('/uploads');

  // Set up our before hooks
  uploadService.before(hooks.before);

  // Set up our after hooks
  uploadService.after(hooks.after);
};
