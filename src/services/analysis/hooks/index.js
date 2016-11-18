'use strict';

var fs = require('fs');
var async = require('async');
var request = require('request');
var hooks = require('feathers-hooks');
var auth = require('feathers-authentication').hooks;

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] }),
    function(hook){
      hook.data.createdAt = hook.data.created;
      return hook;
    }
  ],
  update: [
    hooks.disable()
  ],
  patch: [
    hooks.disable()
  ],
  remove: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] })
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
