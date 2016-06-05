'use strict';

var _ = require('underscore');
var hooks = require('feathers-hooks');
var auth = require('feathers-authentication').hooks;
var errors = require('feathers-errors');

var retrisctToOwnerOrAdmin = function() {

  return function(hook) {
    if (hook.data && hook.data.creatorId) delete hook.data.creatorId;

    var userId = hook.params.user.id;
    var userRoles = hook.params.user.roles;

    return new Promise( function (resolve, reject) {

      var Views = hook.app.service('views');

      return Views.get(hook.id).then(function(data) {

        if (data.toJSON) {
          data = data.toJSON();
        }
        else if (data.toObject) {
          data = data.toObject();
        }

        var creatorId = data.creatorId;

        if (_.contains(userRoles, 'admin') || (creatorId.toString() == userId.toString()) )
          resolve(hook);
        else reject(new errors.Forbidden('You do not have the permissions to access this.'));
      }).catch(reject);
    });
  }
};

var setLayergroup = function(hook) {
  return new Promise(function(resolve, reject){
    var MapController = hook.app.get('mapController');
    MapController.getLayerGroupId(hook.data, function(err, layergroupId){
      if (err) {
        console.log('error getLayerGroupId');
        console.log(err);
        return reject(err);
      }
      hook.data.layergroupId = layergroupId;
      resolve();
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
    auth.restrictToRoles({ roles: ['admin', 'editor'] }),
    setLayergroup,
    function(hook) {
      hook.data.creatorId = hook.params.user.id;
    }
  ],
  update: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    retrisctToOwnerOrAdmin(),
    setLayergroup
  ],
  patch: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    retrisctToOwnerOrAdmin(),
    setLayergroup
  ],
  remove: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    retrisctToOwnerOrAdmin()
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [
    function(hook){
      hook.app.log('info', 'created view "'+hook.data.id+'" for layer "'+hook.data.layerId+'" by "'+hook.params.user.email+'"', {
        event: 'viewCreated',
        viewId: hook.data.id,
        layerId: hook.data.layerId,
        user: hook.params.user.email
      });
      return hook;
    }
  ],
  update: [
    function(hook){
      hook.app.log('info', 'updated view "'+hook.id+'" for layer "'+hook.data.layerId+'" by "'+hook.params.user.email+'"', {
        event: 'viewUpdated',
        viewId: hook.id,
        layerId: hook.data.layerId,
        user: hook.params.user.email
      });
      return hook;
    }
  ],
  patch: [
    function(hook){
      hook.app.log('info', 'updated view "'+hook.id+'" for layer "'+hook.data.layerId+'" by "'+hook.params.user.email+'"', {
        event: 'viewUpdated',
        viewId: hook.id,
        layerId: hook.data.layerId,
        user: hook.params.user.email
      });
      return hook;
    }
  ],
  remove: [
    function(hook){
      hook.app.log('info', 'removed view "'+hook.result.id+'" for layer "'+hook.result.layerId+'" by "'+hook.params.user.email+'"', {
        event: 'viewRemoved',
        view: hook.result,
        user: hook.params.user.email
      });
      return hook;
    }
  ]
};
