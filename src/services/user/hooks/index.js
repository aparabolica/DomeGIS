'use strict';

var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');
var auth = require('feathers-authentication').hooks;

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['admin'] })
  ],
  find: [
  ],
  get: [
  ],
  create: [
  ],
  update: [
  ],
  patch: [
  ],
  remove: [
  ]
};

exports.after = {
  all: [hooks.remove('password')],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
