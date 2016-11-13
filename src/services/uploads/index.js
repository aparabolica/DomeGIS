'use strict';

var service = require('feathers-memory');
var formidable = require('formidable');

// hooks
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var form = new formidable.IncomingForm();
  form.encoding = 'utf-8';

  app.use('/uploads', function (req, res, next) {
    form.parse(req, function (err, fields, files) {
      if (err) {
        next(err);
        return;
      }

      req.feathers.file = files.file;
      req.feathers.name = fields.name;

      next();
    });
  }, service()
);

  // Get our initialize service to that we can bind hooks
  var uploadService = app.service('/uploads');

  // Set up our before hooks
  uploadService.before(hooks.before);

  // Set up our after hooks
  uploadService.after(hooks.after);
};
