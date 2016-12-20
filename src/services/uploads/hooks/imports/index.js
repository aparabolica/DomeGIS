'use strict';

var crypto = require('crypto');
var errors = require('feathers-errors');
var raster2pgsql = require('./raster');
var zipfile = require('./zipfile');
var kml = require('./kml');

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
    return raster2pgsql(hook);

  // kml layer
  } else if (hook.params && hook.params.file && hook.params.file.type == 'application/vnd.google-earth.kml+xml') {

    hook.result.layer.type = 'vector';

    return kml(hook);
  // shapefile layer
  } else if (hook.params && hook.params.file && hook.params.file.type == 'application/zip') {

    hook.result.layer.type = 'vector';

    // init raster import job
    return zipfile(hook);

  // invalid or non-supported file
  } else {
    throw new errors.BadRequest('Unsupported file format');
  }
}
