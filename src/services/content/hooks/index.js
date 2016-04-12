'use strict';

var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');


exports.before = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    hook.data.createdAt = hook.data.created;
    hook.data.modifiedAt = hook.data.modified;
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
    hook.app.service('layers').create({
      name: 'layer 1',
      contentId: hook.data.id
    }).then(function(result){
      return hook.app.service('layers').create({
            name: 'layer 2',
            contentId: hook.data.id
      }).then(function(result){
        return hook;
      })
    }).catch(function(err){
      console.log('erro');
      console.log(err);
    });
  }],
  update: [function(hook){
  }],
  patch: [],
  remove: []
};
