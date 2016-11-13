'use strict';

var _ = require('underscore');
var exec = require('child_process').exec;
var crypto = require('crypto');

var hooks = require('feathers-hooks-common');
var importJob = require('./imports');

var debug = require('debug');
var log = debug('domegis:service:uploads');

exports.before = {
  create: []
}

exports.after = {
  create: [
    importJob.init,
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
