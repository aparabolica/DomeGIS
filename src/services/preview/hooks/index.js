"use strict";

var _ = require("underscore");
var errors = require("feathers-errors");
var hooks = require("feathers-hooks-common");
var auth = require("feathers-authentication").hooks;

var setLayergroup = function(hook) {
  return new Promise(function(resolve, reject) {
    var MapController = hook.app.get("mapController");

    if (!hook.data.style)
      return reject(
        new errors.BadRequest("Missing 'style' property for preview.")
      );

    MapController.getLayerGroupId(hook.data, function(err, layergroupId) {
      if (err) return reject(err);
      hook.data.layergroupId = layergroupId;
      resolve();
    });
  });
};

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ["editor", "author"] }),
    function(hook) {
      return new Promise(function(resolve, reject) {
        var Layers = hook.app.service("layers");

        hook.data.creatorId = hook.params.user.id;

        Layers.get(hook.data.layerId)
          .then(function(layer) {
            hook.data.type = layer.type;
            resolve();
          })
          .catch(reject);
      });
    },
    setLayergroup
  ],
  update: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ["editor", "author"] }),
    setLayergroup
  ],
  patch: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ["editor", "author"] }),
    setLayergroup
  ],
  remove: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ["editor", "author"] })
  ]
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
