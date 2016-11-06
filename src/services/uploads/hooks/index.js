'use strict';

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
            status: 'importing',
            name: hook.params.name
          }

          var cmd = 'raster2pgsql -d -Y -t "auto" ' + filePath + ' public.' + layerId + ' | psql -d domegis -U domegis';
          exec(cmd, function (err) {
            var status = err ? 'error' : 'imported';

            Layers.patch(layerId, {
              status: status
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
