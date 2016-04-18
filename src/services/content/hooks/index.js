'use strict';

var async = require('async');
var request = require('request');
var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    hook.data.createdAt = hook.data.created;
    hook.data.modifiedAt = hook.data.modified;
    return hook;
  }],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    return new Promise(function(resolve, reject){
      var Layers = hook.app.service('layers');
      request({
        url: hook.data.url,
        qs: {
          f: 'json'
        }
      }, function(err, res, body){
        if (err) return reject(err);

        var results = JSON.parse(body);
        var layers = results.layers;

        async.eachSeries(layers, function(layer, doneLayer){
          // set content id
          layer.contentId = hook.data.id;
          layer.index = layer.id;
          layer.id = hook.data.id + '_' + layer.id;
          Layers
            .create(layer)
            .then(function(result){
              doneLayer();
            })
            .catch(reject);
        }, resolve);
      });
    });
  }],
  update: [],
  patch: [],
  remove: [function(hook){
    return new Promise(function(resolve, reject){
      hook.app.service('layers')
        .remove(null, {contentId: hook.id})
        .then(function(results){
          resolve();
        });
    });
  }]
};
