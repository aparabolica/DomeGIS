'use strict';

var exec = require('child_process').exec;
var async = require('async');
var dauria = require('dauria');
var hooks = require('feathers-hooks-common');
var crypto = require('crypto');

var uploadsDir = '/tmp/domegis/uploads/';

exports.before = {
  create: [
    function(hook) {
      if (!hook.data.uri && hook.params.file){
        var file = hook.params.file;
        var uri = dauria.getBase64DataURI(file.buffer, file.mimetype);
        hook.data.type = file.mimetype;
        hook.data.uri = uri;
      }
    }
  ]
}

exports.after = {
  create: [
    function(hook){
      return new Promise(function(resolve, reject){

        // file upload is a tiff
        if (hook.data.type && hook.data.type == 'image/tiff') {

          var filePath = uploadsDir + hook.result.id;
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
                name: hook.data.name
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
