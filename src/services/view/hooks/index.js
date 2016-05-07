'use strict';

var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');

var setLayergroup = function(hook) {
  return new Promise(function(resolve, reject){
    var MapController = hook.app.get('mapController');
    MapController.getLayerGroupId(hook.data, function(err, layergroupId){
      if (err) return reject(err);
      hook.data.layergroupId = layergroupId;
      resolve();
    });
  });
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [setLayergroup],
  update: [setLayergroup],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
