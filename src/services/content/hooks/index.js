'use strict';

var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');


exports.before = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    hook.data._id = hook.data.id
  }],
  update: [],
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
