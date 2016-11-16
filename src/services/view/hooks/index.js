'use strict';

var _ = require('underscore');
var hooks = require('feathers-hooks');
var auth = require('feathers-authentication').hooks;
var errors = require('feathers-errors');

var setLayergroup = function(hook) {
  var opts = hook.app.get('windshaftOpts');

  return new Promise(function(resolve, reject){
    var MapController = hook.app.get('mapController');
    var view = hook.data || hook.result;

    MapController.getLayerGroupId(view, function(err, layergroupId){
      if (err) return reject(err);

      var expiresAt = Date.now() + opts.layergroup_ttl * 1000;

      // refresh an existing view (via `get` method)
      if (hook.method == 'get') {
        var sequelize = hook.app.get('sequelize');
        var Views = sequelize.models.views;

        Views.update({
          layergroupId: layergroupId,
          expiresAt: expiresAt
        }, {
          where: { id: hook.id },
          hooks: false
        })
        .then(function(){
          hook.result.layergroupId = layergroupId;
          hook.result.expiresAt = expiresAt;
          resolve();
        })
        .catch(reject);

      // set layergroupId for new view
      } else {
        hook.data.layergroupId = layergroupId;
        hook.data.expiresAt = expiresAt;
        resolve();
      }
    });
  });
}


exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor', 'author'] }),
    function(hook) {
      return new Promise(function(resolve, reject){
        var Layers = hook.app.service('layers');

        hook.data.creatorId = hook.params.user.id;

        Layers.get(hook.data.layerId).then(function(layer){
          hook.data.type = layer.type;
          resolve();
        }).catch(reject);
      });
    },
    setLayergroup
  ],
  update: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'], owner: true, ownerField: 'creatorId', idField: 'id' }),
    setLayergroup
  ],
  patch: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'], owner: true, ownerField: 'creatorId', idField: 'id' }),
    setLayergroup
  ],
  remove: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'], owner: true, ownerField: 'creatorId', idField: 'id' })
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [
    function(hook){
      var view = hook.result;
      if (!view.expiresAt || (Date.now() > view.expiresAt )) {
        return setLayergroup(hook);
      }
    }
  ],
  create: [
    function(hook){
      hook.app.log('info', 'created view "'+hook.data.id, {
        event: 'viewCreated',
        viewId: hook.data.id,
        layerId: hook.data.layerId,
        userId: hook.params.user.email
      });
      return hook;
    }
  ],
  update: [
    function(hook){
      hook.app.log('info', 'updated view "'+hook.id+'" for layer "'+hook.data.layerId, {
        event: 'viewUpdated',
        viewId: hook.id,
        layerId: hook.data.layerId,
        userId: hook.params.user.email
      });
      return hook;
    }
  ],
  patch: [
    function(hook){
      hook.app.log('info', 'updated view "'+hook.id+'" for layer "'+hook.data.layerId, {
        event: 'viewUpdated',
        viewId: hook.id,
        layerId: hook.data.layerId,
        userId: hook.params.user.email
      });
      return hook;
    }
  ],
  remove: [
    function(hook){
      hook.app.log('info', 'removed view "'+hook.result.id+'" for layer "'+hook.result.layerId, {
        event: 'viewRemoved',
        view: hook.result,
        userId: hook.params.user.email
      });
      return hook;
    }
  ]
};
