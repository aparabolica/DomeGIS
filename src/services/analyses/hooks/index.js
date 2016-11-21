'use strict';

var fs = require('fs');
var async = require('async');
var request = require('request');
var hooks = require('feathers-hooks-common');
var auth = require('feathers-authentication').hooks;
var runQuery = require('./run-query');

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] }),
    runQuery
  ],
  update: [
    hooks.disable()
  ],
  patch: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] }),
    hooks.pluck(), // remove all data sent by user
    runQuery
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
