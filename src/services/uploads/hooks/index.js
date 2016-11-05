'use strict';

var exec = require('child_process').exec;
var hooks = require('feathers-hooks-common');
var crypto = require('crypto');

exports.before = {
  create: []
}

exports.after = {
  create: [
    function(hook){
      return new Promise(function(resolve, reject){

        // file upload is a tiff
        if (hook.params.file && hook.params.file.type == 'image/tiff') {

          var filePath = hook.params.file.path;
          var layerId = crypto.randomBytes(20).toString('hex');

          var cmd = 'raster2pgsql -d -s 4618 -F -t "auto" ' + filePath + ' public.' + layerId + ' | psql -d domegis -U domegis';

          exec(cmd, function (err) {
            if (err) {
              reject('could not import raster');
            } else {
              hook.result.layer = {
                id: layerId,
                source: 'uploaded',
                type: 'raster',
                name: hook.params.name
              }
              resolve();
            }
          });
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
