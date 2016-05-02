'use strict';

var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');
var request = require('request');
var Sequelize = require('sequelize');
var async = require('async');


exports.before = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    return new Promise(function(resolve, reject){
      request({
        url: hook.data.url,
        qs: {
          f: 'json'
        }
      }, function(err, res, body){
        if (err) return reject(err);

        var metadata = JSON.parse(body);

        switch (metadata.geometryType) {
          case "esriGeometryPoint":
            hook.data.geometryType = 'POINT'
            break;
          case "esriGeometryMultipoint":
            hook.data.geometryType = 'MULTIPOINT'
            break;
          case "esriGeometryLine":
            hook.data.geometryType = 'LINE'
            break;
          case "esriGeometryMultiLineString":
            hook.data.geometryType = 'MULTILINESTRING'
            break;
          case "esriGeometryPolygon":
            hook.data.geometryType = 'POLYGON'
            break;
        }

        hook.data.fields = metadata.fields;
        resolve();
      });
    });
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
    var sequelize = hook.app.get('sequelize');
    return new Promise(function(resolve, reject){
      request({
        url: hook.data.url + '/query',
        qs: {
          returnGeometry: true,
          where: '1=1',
          outFields: '*',
          f: 'geojson'
        }
      }, function(err, res, body){
        if (err) return reject(err);
        var data = JSON.parse(body);

        // create feature table
        var Features = sequelize.define(hook.data.id, {
          geometry: { type: Sequelize.GEOMETRY }
        });
        sequelize.sync().then(function(){

          // insert features
          async.eachSeries(data.features, function(feature, doneEach){
            feature.geometry.crs = data.crs;
            Features.create({
              geometry: feature.geometry
            }).then(function(result){
              doneEach()
            }).catch(reject);
          }, resolve);

        }).catch(reject);

      });
    });
  }],
  update: [],
  patch: [],
  remove: []
};
