'use strict';

var fs = require('fs');
var async = require('async');
var request = require('request');
var hooks = require('feathers-hooks-common');
var auth = require('feathers-authentication').hooks;
var runQuery = require('./run-query');

function initTaskStatus(hook) {
  if (!hook.params.bypassRunQuery && ( hook.data.query || hook.data.forceExecution )) {
    hook.data.task = {
      status: 'running',
      startedAt: Date.now()
    };
  }
  return hook;
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] }),
    initTaskStatus
  ],
  update: [
    hooks.disable()
  ],
  patch: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] }),
    initTaskStatus
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
  create: [
    runQuery
  ],
  update: [],
  patch: [
    runQuery
  ],
  remove: []
};
