'use strict';

var crypto = require('crypto');
var errors = require('feathers-errors');
var raster2pgsql = require('./raster');

module.exports.init = function(hook) {

  // generate layer id
  var layerId = crypto.randomBytes(20).toString('hex');

  // bootstrap layer
  hook.result.layer = {
    id: crypto.randomBytes(20).toString('hex'),
    source: 'uploaded',
    name: hook.params.name,
    sync: {
      status: 'importing',
      startedAt: Date.now()
    }
  }

  // raster layer
  if (hook.params && hook.params.file && hook.params.file.type == 'image/tiff') {

    hook.result.layer.type = 'raster';

    // init raster import job
    raster2pgsql(hook);

    return hook;

  // invalid or non-supported file
  } else {
    return new errors.BadRequest('Invalid file or non-supported format');
  }
}
