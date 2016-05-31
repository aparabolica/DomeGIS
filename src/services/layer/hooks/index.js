'use strict';

var _ = require('underscore');
var async = require('async');
var hooks = require('feathers-hooks');
var request = require('request');
var Sequelize = require('sequelize');
var auth = require('feathers-authentication').hooks;

function esriToSequelizeType(esriType) {
  switch (esriType) {
    case 'esriFieldTypeSmallInteger':
      return Sequelize.INTEGER;
      break;
    case 'esriFieldTypeInteger':
      return Sequelize.BIGINT;
      break;
    case 'esriFieldTypeSingle':
      return Sequelize.FLOAT;
      break;
    case 'esriFieldTypeDouble':
      return Sequelize.DOUBLE;
      break;
    case 'esriFieldTypeString':
      return Sequelize.STRING;
      break;
    case 'esriFieldTypeDate':
      return Sequelize.DATE;
      break;
    case 'esriFieldTypeOID':
      return Sequelize.BIGINT;
      break;
    case 'esriFieldTypeGeometry':
      return Sequelize.GEOMETRY;
      break;
    case 'esriFieldTypeBlob':
      return Sequelize.BLOB;
      break;
    case 'esriFieldTypeGUID':
      return Sequelize.STRING;
      break;
    case 'esriFieldTypeGlobalID':
      return Sequelize.STRING;
      break;
    case 'esriFieldTypeXML':
      return Sequelize.TEXT;
      break;
    default:
      return null;
  }
}

function dropLayer(sequelize, layerId, doneResetLayer) {
  sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'s\"')
    .then(function(results){
      doneResetLayer();
    }).catch(doneResetLayer);
}

function getLayerProperties(url, doneGetLayerProperties) {
  request({
    url: url,
    qs: {
      f: 'json'
    }
  }, function(err, res, body){
    if (err) return doneGetLayerProperties(err);

    var properties = JSON.parse(body);

    switch (properties.geometryType) {
      case "esriGeometryPoint":
        properties.geometryType = 'POINT'
        break;
      case "esriGeometryMultipoint":
        properties.geometryType = 'MULTIPOINT'
        break;
      case "esriGeometryLine":
        properties.geometryType = 'LINE'
        break;
      case "esriGeometryPolyline":
        properties.geometryType = 'LINESTRING'
        break;
      case "esriGeometryPolygon":
        properties.geometryType = 'MULTIPOLYGON'
        break;
    }

    properties.srid = properties.extent.spatialReference.latestWkid || properties.extent.spatialReference.wkid;

    doneGetLayerProperties(null, properties);
  });
}

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
      return new Promise(function(resolve, reject){

        var sequelize = hook.app.get('sequelize');

        async.series([
          function(doneStep){
            dropLayer(sequelize, hook.data.id, function(err){
              if (err) return reject(err);
              else doneStep();
            })
          },
          function(doneStep){
            getLayerProperties(hook.data.url, function(err, properties){
              if (err) return reject(err);
              hook.data.geometryType = properties.geometryType;
              hook.data.fields = _.map(properties.fields, function(field) {
                field.title = {
                  "en": field.name,
                  "es": field.name,
                  "pt": field.name
                }
                return field;
              });
              resolve();
            })
          }
        ]);
      });
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
  create: [function(hook){
    var Layers = hook.app.service('layers');
    var sequelize = hook.app.get('sequelize');
    var layerId = hook.data.id;

    Layers.emit('created', hook.data);

    function emitSyncFinishEvent(err, data) {
      var status = 'synced';
      if (err) {
        console.log(hook.data.id + ': sync error');
        console.log(err);
        status = 'sync error';
      };

      Layers.patch(layerId, {
        status: status
      }).then(function(){
        Layers.emit('syncFinish', layerId);
      }).catch(function(err){
        console.log(hook.data.id + ': error setting status');
        console.log(err);
      });
    }

    request({
      url: hook.data.url + '/query',
      qs: {
        where: '1=1',
        returnCountOnly: 'true',
        f: 'json'
      }
    }, function(err, res, body) {
      var data = {};
      try {
        data = JSON.parse(body);
      } catch (e) {
        return emitSyncFinishEvent({message: 'could not parse json'})
      }

      if(!data.count) {

        console.log(hook.data.id + ': no features');

        Layers.patch(layerId, {
          featureCount: 0
        }).then(function(result){
          emitSyncFinishEvent()
        }).catch(function(err){
          console.log(hook.data.id + ': error update layer count to 0');
          console.log(err);
        });

      } else {

        var total = data.count;
        var current = 0;
        var perPage = 100;
        var geojson = {};

        async.whilst(
          function() {
            return current < total;
          },
          function(cb) {
            request({
              url: hook.data.url + '/query',
              qs: {
                returnGeometry: true,
                where: '1=1',
                outSR: 4326,
                resultOffset: current,
                resultRecordCount: perPage,
                outFields: '*',
                f: 'geojson'
              }
            }, function(err, res, body) {

              var data = {};
              try {
                data = JSON.parse(body);
              } catch (e) {
                console.log('could not parse json');
              }

              if(data.features.length) {
                if(current == 0) {
                  geojson = data;
                } else {
                  geojson.features = geojson.features.concat(data.features);
                }
              }

              Layers.emit('syncProgress', {
                layerId: hook.data.id,
                progress: geojson.features.length/total
              });

              current = current + perPage;
              cb();

            })
          },
          function() {

            var postgisType = geojson.features[0]['geometry']['type'];

            switch (postgisType) {
              case 'Polygon':
                postgisType = 'MultiPolygon';
                break;
              case 'LineString':
                postgisType = 'MultiLineString';
                break;
            }

            var schema = {
              geometry: { type: Sequelize.GEOMETRY(postgisType, 4326) }
            }

            _.each(hook.data.fields, function(field){
              var fieldType = esriToSequelizeType(field.type);
              if (fieldType) schema[field.name] = { type: fieldType }
            });

            // drop table if exists
            sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'s\";').then(function(){
              // create feature table
              var Features = sequelize.define(layerId, schema);
              sequelize.sync().then(function(){

                // insert features
                async.eachSeries(geojson.features, function(esriFeature, doneEach){

                  // set srid on feature (because of PostGIS)
                  esriFeature.geometry.crs = geojson.crs;

                  // create fake MultiPolygon if needed
                  if (postgisType == 'MultiPolygon' && esriFeature.geometry.type == 'Polygon') {
                    esriFeature.geometry.type = 'MultiPolygon';
                    esriFeature.geometry.coordinates = [esriFeature.geometry.coordinates];
                  } else if (postgisType == 'MultiLineString' && esriFeature.geometry.type == 'LineString') {
                    esriFeature.geometry.type = 'MultiLineString';
                    esriFeature.geometry.coordinates = [esriFeature.geometry.coordinates];
                  }

                  _.each(_.keys(esriFeature.properties), function(property){
                    esriFeature[property] = esriFeature.properties[property];
                  });

                  Features.create(esriFeature).then(function(result){
                    doneEach();
                  }).catch(emitSyncFinishEvent);
                }, function(err){
                  if (err) return emitSyncFinishEvent(err);
                  var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layerId +"s\"), \"featureCount\" = " + geojson.features.length + "  WHERE (layers.id =  '"+ layerId +"');"
                  sequelize.query(query).then(function(result){
                    emitSyncFinishEvent();
                  }).catch(emitSyncFinishEvent);
                });
              }).catch(emitSyncFinishEvent);
            }).catch(emitSyncFinishEvent);
          }
        )

      }

    });

  }],
  update: [],
  patch: [],
  remove: []
};
