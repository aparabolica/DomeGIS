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
    auth.restrictToRoles({ roles: ['admin'] }),
    function(hook) {
      // remove associated layer tables and shapefiles
      return new Promise(function(resolve, reject){
        var Layers = hook.app.service('layers');
        var sequelize = hook.app.get('sequelize');

        Layers.find({query: {contentId: hook.id} }).then(function(layers){
          async.eachSeries(layers.data, function(layer, doneLayer){
            var layerId = layer.id;

            /*
             * Remove layer table
             */
            sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'\";').then(function(){
              var shapefilePath = hook.app.get('public') + '/downloads/' + layerId + '.shp.zip';

              /*
               * Remove shapefile if exists
               */
              try {
                fs.exists(shapefilePath, function(exists) {
                  if (exists) fs.unlinkSync(shapefilePath);
                  doneLayer();
                });
              } catch (e) {
                doneLayer(e);
              }

            }).catch(doneLayer);
          }, function(err){
            if (err) return reject(err);
            resolve();
          })
        }).catch(function(err){
          console.log('err');
          console.log(err);
        });
      });
    }
  ]
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [
    function(hook){
      hook.app.log('info', 'created content "'+hook.data.id, {
        event: 'contentCreated',
        content: hook.data,
        userId: hook.params.user.email
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
          layer.type = 'arcgis';
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
      });
  }],
  update: [],
  patch: [],
  remove: [ function(hook){
    hook.app.log('info', 'removed content "'+hook.result.id, {
        event: 'contentRemoved',
        contentId: hook.result.id,
        userId: hook.params.user.email
    });
    return hook;
  }]
};
