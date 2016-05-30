'use strict';

var async = require('async');
var request = require('request');
var globalHooks = require('../../../hooks');
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
    auth.restrictToRoles({ roles: ['admin', 'editor'] }),
    function(hook){
      hook.data.createdAt = hook.data.created;
      hook.data.modifiedAt = hook.data.modified;
      return hook;
    }
  ],
  update: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['admin', 'editor'] })
  ],
  patch: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['admin', 'editor'] })
  ],
  remove: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['admin'] })
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [
    function(hook){
      hook.app.log('info', 'created content "'+hook.data.id+'" by "'+hook.params.user.email+'"', {
        event: 'contentCreated',
        content: hook.data,
        userEmail: hook.params.user.email
      });
      return hook;
    },
    function(hook){

      var Layers = hook.app.service('layers');
      var Contents = hook.app.service('contents');

      Contents.emit('created', hook.data);

      request({
        url: hook.data.url,
        qs: {
          f: 'json'
        }
      }, function(err, res, body){
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }

        var results = JSON.parse(body);
        var layers = results.layers;

        async.eachSeries(layers, function(layer, doneLayer){
          // set content id
          layer.contentId = hook.data.id;
          layer.index = layer.id;
          layer.url = hook.data.url + '/' + + layer.id;
          layer.id = hook.data.id + '_' + layer.id;
          Layers
            .create(layer)
            .then( function(result) {
              doneLayer();
            })
            .catch(doneLayer);
        }, function(err){
          if (err) {
            console.log('error creating layer');
            console.log(err);
          }
        });
      }); claudia
  }],
  update: [],
  patch: [],
  remove: [
    function(hook){
      hook.app.log('info', 'removed content "'+hook.result.id+'" by "'+hook.params.user.email+'"', {
        event: 'contentRemoved',
        contentId: hook.result.id,
        userEmail: hook.params.user.email
      });
      return hook;
    },
    function(hook){
      return new Promise(function(resolve, reject){
        hook.app.service('layers')
          .remove(null, { query: { contentId: hook.id }})
          .then(function(results){
            resolve();
          });
      });
  }]
};
