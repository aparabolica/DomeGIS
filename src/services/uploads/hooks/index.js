'use strict';

var _ = require('underscore');
var exec = require('child_process').exec;
var hooks = require('feathers-hooks-common');
var errors = require('feathers-errors');
var crypto = require('crypto');

var debug = require('debug');
var log = debug('domegis:service:uploads');

exports.before = {
  create: []
}

exports.after = {
  create: [
    function(hook){

      var Layers = hook.app.service('layers');

      return new Promise(function(resolve, reject){

        // file upload is a tiff
        if (hook.params.file && hook.params.file.type == 'image/tiff') {

          var filePath = hook.params.file.path;
          var layerId = crypto.randomBytes(20).toString('hex');
          hook.result.layer = {
            id: layerId,
            source: 'uploaded',
            type: 'raster',
            name: hook.params.name
          }

          var syncStatus = {
            status: 'importing',
            startedAt: Date.now()
          }
          hook.result.layer.sync = syncStatus;


          var cmd = 'raster2pgsql -d -C -Y -t "auto" ' + filePath + ' public.' + layerId + ' | psql -d domegis -U domegis';
          exec(cmd, function (err) {

            syncStatus = _.extend(syncStatus, {
              status: (err ? 'error' : 'imported'),
              finishedAt: Date.now(),
              message: (err ? err.message : '')
            });


            Layers.patch(layerId, {
              sync: syncStatus
            }).catch(function(err){
              log(layerId + ' error saving raster import status');
            });

          });

          resolve();
        }
      });
    },
    function(hook) {
      return new Promise(function(resolve, reject){

        var Layers = hook.app.service('layers');
        var layer = hook.result.layer;

        Layers
          .create(layer)
          .then( function(result) {
            resolve();
          })
          .catch(reject);
      });

    },
    hooks.pluck('layer')
  ]
}
