'use strict';

// dependencies
var _ = require('underscore');
var gdal = require('gdal');

var Promise = require('bluebird');
var exec = require('child_process').exec;

// promise helper
function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}

// Constants
var GDAL_COMPRESS_OPTIONS = '-co "COMPRESS=JPEG"'; // should use -co "PHOTOMETRIC=YCBCR" if multibands (multicolor)
var GDALWARP_COMMON_OPTIONS   = '-co "COMPRESS=LZW" -co "BIGTIFF=IF_SAFER"';
var PROJECTION                = 3857;
var BLOCKSIZE                 = '128x128';
var RASTER_COLUMN_NAME        = 'the_geom';
var MAX_REDUCTED_SIZE         = 256;

module.exports = function(hook) {

  var filePath = hook.params.file.path;
  var downsampledFilePath;
  var compressedFilePath = filePath + "_jpeg.tif";
  var mercatorFilePath = filePath + "_webmercator.tif";
  var alignedFilePath = filePath + "_aligned_webmercator.tif";
  var scale;
  var rasterSize;
  var pixelSize;
  var overviewsList;
  var layer = _.clone(hook.result.layer);
  var Layers = hook.app.service('layers');

  downsample()
    .then(reproject)
    .then(getMetadata)
    .then(alignRaster)
    // .then(compress) // temporarily disabled until we dig into the side-effects
    .then(importAlignedRaster)
    .then(createBaseOverview)
    .then(dropBaseTable)
    .then(importOriginalRaster)
    .then(updateLayerStatus)
    .catch(updateLayerStatus);

  // TODO scale non-Byte bands to Byte
  function downsample(){
    return new Promise(function(resolve,reject){
      var dataset = gdal.open(filePath);
      var bands = [];
      var cmd;

      for (var i = 1; i <= dataset.bands.count(); i++) {
        var type = dataset.bands.get(i).dataType;
        if (type != 'Byte') {
          downsampledFilePath = filePath + "_downsampled.tif";
          cmd = 'gdal_translate -scale -ot Byte ' + GDALWARP_COMMON_OPTIONS + ' ' + filePath + ' ' + downsampledFilePath;
          break;
        }
      }

      if (cmd) {
        exec(cmd)
          .addListener("error", reject)
          .addListener("exit", resolve);
      } else resolve();

    });
  }

  function reproject(){
    var sourceFile = downsampledFilePath || filePath;
    var cmd = 'gdalwarp -t_srs EPSG:' + PROJECTION + ' ' + sourceFile + ' ' + mercatorFilePath;
    return promiseFromChildProcess(exec(cmd));
  }

  function getMetadata(){
    return new Promise(function(resolve,reject){
      var dataset = gdal.open(mercatorFilePath);

      rasterSize = dataset.rasterSize;
      pixelSize = Math.abs(dataset.geoTransform[5]);

      // calculate scale
      var z0 = 156543.03515625;
      var factor = z0 / pixelSize;
      var pw = Math.log(factor) / Math.log(2);
      var pow2 = Math.ceil(pw);
      var outScale = z0 / Math.pow(2, pow2);
      scale = outScale - (outScale * 0.0001);

      // calculate overviews list
      var biggerSize = _.max(_.values(rasterSize));
      var maxPower =
        (biggerSize > MAX_REDUCTED_SIZE) ?
          Math.ceil(Math.log2(biggerSize / MAX_REDUCTED_SIZE)) : 0;
      var range = _.range(1, maxPower + 2);
      overviewsList = _.map(range, function(x) { return Math.pow(2, x); })
      overviewsList = _.select(overviewsList, function(x) { return x < 1000; });

      // get bands
      var bands = [];
      for (var i = 1; i <= dataset.bands.count(); i++) {
        bands.push(dataset.bands.get(i));
      }

      layer.metadata = {
        bands: bands
      }

      resolve();
    });
  }

  function alignRaster(){
    var cmd = 'gdalwarp ' + GDALWARP_COMMON_OPTIONS + ' -tr ' + scale + ' -' + scale + ' ' + mercatorFilePath + ' ' + alignedFilePath;
    return promiseFromChildProcess(exec(cmd));
  }

  function compress() {
    var cmd = 'gdal_translate ' + GDAL_COMPRESS_OPTIONS + ' ' + alignedFilePath + ' ' + compressedFilePath;
    return promiseFromChildProcess(exec(cmd));
  }

  function importAlignedRaster(){
    var cmd = 'raster2pgsql -s ' + PROJECTION + ' -t ' + BLOCKSIZE + ' -C -x -Y -I -f ' + RASTER_COLUMN_NAME + ' -l ' + overviewsList.join(',') + ' ' + alignedFilePath + ' public.' + layer.id + ' | psql -d domegis -U domegis';
    return promiseFromChildProcess(exec(cmd));
  }

  function createBaseOverview(){
    return new Promise(function (resolve, reject){

      var sequelize = hook.app.get('sequelize');
      var overviewTableName = 'o_1_' + layer.id;
      // var query = "CREATE TABLE public.\"" + overviewTableName + "\" AS SELECT * FROM public.\"" + layer.id + "\";\n" +
      //             "CREATE INDEX ON public.\"" +  overviewTableName + "\" USING gist (st_convexhull(\"" + RASTER_COLUMN_NAME + "\"));\n" +
      //             "SELECT AddRasterConstraints('public', '" + overviewTableName + "', '" + RASTER_COLUMN_NAME + "',TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,TRUE,TRUE,TRUE,TRUE,FALSE);\n" +
      //             "SELECT AddOverviewConstraints('public', '" + overviewTableName + "'::name, '" + RASTER_COLUMN_NAME + "'::name, 'public', '" + layer.id + "'::name, '" + RASTER_COLUMN_NAME + "'::name, 1)";
      var query = "CREATE TABLE public.\"" + overviewTableName + "\" AS SELECT * FROM public.\"" + layer.id + "\";\n" +
                  "CREATE INDEX ON public.\"" +  overviewTableName + "\" USING gist (st_convexhull(\"" + RASTER_COLUMN_NAME + "\"));\n";
      sequelize.query(query).then(function(result){
        resolve();
      }).catch(reject);
    });
  }

  function dropBaseTable(){
    return new Promise(function(resolve, reject){
      var sequelize = hook.app.get('sequelize');
      var query = "DROP TABLE \"" + layer.id + "\";";
      sequelize.query(query)
        .then(function(){
          resolve();
        })
        .catch(reject);
    });
  }

  function importOriginalRaster(){
    var cmd = 'export PGCLIENTENCODING=UTF8; raster2pgsql -t ' + BLOCKSIZE + ' -C -I -x -Y -f ' + RASTER_COLUMN_NAME + ' ' + filePath + ' public.' + layer.id+ ' | psql -d domegis -U domegis';
    return promiseFromChildProcess(exec(cmd));
  }

  function updateLayerStatus(err){
    if (err) {
      console.log(err);
      layer.sync.status = 'error';
      layer.sync.message = err.message;
    } else {
      layer.sync.status = 'imported';
    }

    layer.sync.finishedAt = Date.now();

    // update layer
    Layers.patch(layer.id, {
      metadata: layer.metadata,
      sync: layer.sync
    }).catch(function(err){
      log(layerId + ' error saving raster import status');
    });
  }
}
