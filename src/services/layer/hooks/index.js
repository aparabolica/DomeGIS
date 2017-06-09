'use strict';

var debug = require('debug');
var log = debug('domegis:service:layers');

var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var hooks = require('feathers-hooks-common');
var request = require('request');
var Sequelize = require('sequelize');
var auth = require('feathers-authentication').hooks;
var errors = require('feathers-errors');
var exec = require('child_process').exec;

var handleSyncFinishEvent = require('../common').handleSyncFinishEvent;
var derivedLayers = require('./derived');

function setInitSyncStatus (hook) {
  if (!hook.data.sync) {
    hook.data.sync = {
      status: 'initiated',
      featureCount: 0,
      startedAt: Date.now()
    }
  }
  return hook;
}

function isDerived (hook) {
  return hook.data.source == 'derived';
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
    setInitSyncStatus,
    hooks.iff(isDerived, derivedLayers.before),
    function(hook){
      return new Promise(function(resolve, reject){

        var sequelize = hook.app.get('sequelize');

        async.series([
          // remove layer's feature table is exists
          function(doneStep){
            dropLayer(sequelize, hook.data.id, function(err){
              if (err) return reject(err);
              else doneStep();
            })
          },
          function(doneStep){
            if (hook.data.source == 'arcgis'){
              getArcGisLayerProperties(hook.data.url, function(err, properties){
                if (err) return reject(err);
                hook.data.geometryType = properties.geometryType;
                hook.data.featureCount = properties.featureCount;
                hook.data.fields = _.map(properties.fields, function(field) {
                  field.title = {
                    "en": field.name,
                    "es": field.name,
                    "pt": field.name
                  }
                  return field;
                });
                hook.data.metadata = properties;
                hook.data.sync = {
                  status: 'initiated',
                  featureCount: 0,
                  startedAt: Date.now()
                }
                resolve();
              });
            } else if ((hook.data.source == 'derived') || (hook.data.source == 'uploaded')) {
              resolve();
            } else {
              reject(new errors.GeneralError('Missing SQL query.'));
            }
          }
        ]);
      });
    }
  ],
  update: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] })
  ],
  patch: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['editor'] }),
    function(hook){
      return new Promise(function(resolve, reject){
        if (hook.data.resync == true || hook.data.resync == 'force') syncArcGisLayerFeatures(hook);
        resolve();
      });
    }
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
    hooks.iff(isDerived, derivedLayers.after),
    function(hook){
      return new Promise(function(resolve, reject){

        /*
         * Sync ArcGIS Layer
         */

        if (hook.data.source == 'arcgis') {
          log('layer metadata saved, trying to to sync from arcgis');
          syncArcGisLayerFeatures(hook)
          resolve();
        } else resolve();

      });
    }
  ],
  update: [],
  patch: [],
  remove: []
};

/*
* General Layer functions
*/





var generateDatafiles = function(hook, layer, doneGenerateDatafiles) {

  var publicDir = hook.app.get('public');
  var dbParams = hook.app.get('windshaftOpts').dbParams;
  var pgConnectionString = 'PG:"host='+dbParams.dbhost+' user='+dbParams.dbuser+' dbname='+dbParams.dbname+' password='+dbParams.dbpassword+'"';
  var layerId = layer.id;

  log('will generate datafile for ' + layerId);

  if (!layer.metadata) layer.metadata = {};

  var shpDatapackage = {
    "name": layer.name,
    "title": layer.metadata.title || "",
    "description": layer.metadata.description || "",
    "license": {
      "copyrightText": layer.metadata.copyrightText || ""
    },
    "url": layer.url,
    "resources": [
      {
        "name": layerId + ".shp",
        "path": layerId + ".shp",
        "schema": {
          "fields": layer.fields
        }
      }
    ]
  }

  var csvDatapackage = {
    "name": layer.name,
    "title": layer.metadata.title || "",
    "description": layer.metadata.description || "",
    "license": {
      "copyrightText": layer.metadata.copyrightText || ""
    },
    "url": layer.url,
    "resources": [
      {
        "name": layerId + ".csv",
        "path": layerId + ".csv",
        "schema": {
          "fields": layer.fields
        }
      }
    ]
  }

  // command steps
  var cmds = [
    'mkdir -p '+publicDir+'/downloads',
    'mkdir -p /tmp/domegis/shapefiles',
    'ogr2ogr -overwrite -f "ESRI Shapefile" /tmp/domegis/shapefiles/' + layerId + ' ' + pgConnectionString + ' ' + layerId,
    'echo \''+ JSON.stringify(shpDatapackage, null, '\t') +'\' > /tmp/domegis/shapefiles/' + layerId + '/datapackage.json',
    'zip -ju '+publicDir+'/downloads/'+layerId+'.shp.zip /tmp/domegis/shapefiles/' + layerId + '/*',
    'rm -rf /tmp/domegis/shapefiles/'+layerId,
    'mkdir -p /tmp/domegis/csvs/' + layerId,
    'ogr2ogr -overwrite -f "CSV" /tmp/domegis/csvs/'+layerId+'/'+layerId+'.csv ' + pgConnectionString + ' ' + layerId,
    'echo \''+ JSON.stringify(csvDatapackage, null, '\t') +'\' > /tmp/domegis/csvs/' + layerId + '/datapackage.json',
    'zip -ju '+publicDir+'/downloads/'+layerId+'.csv.zip /tmp/domegis/csvs/'+layerId+'/*',
    'rm -rf /tmp/domegis/csvs/'+layerId
  ]

  async.eachSeries(cmds, function(cmd, doneCmd){
    exec(cmd, function(error, stdout, stderr) {
      if (error) return doneCmd(error);
      doneCmd();
    });
  }, function(err){
    if (err) {
      log(err);
      doneGenerateDatafiles({message:'could not generate shapefile'}, hook, layer)
    } else doneGenerateDatafiles(null, hook, layer);
  });
}

function dropLayer(sequelize, layerId, doneResetLayer) {
  sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'\"')
    .then(function(results){
      doneResetLayer();
    }).catch(doneResetLayer);
}

/*
 * ArcGIS layer functions
 */

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

/*
 * Get feature type, srid and feature count
 */
function getArcGisLayerProperties(url, doneGetArcGisLayerProperties) {

  var properties;

  /*
   * Make two requests in parallel and return properties
   */
  async.series([
    function(doneGetFeatureType) {

      // get geometry type
      request({
        url: url,
        qs: {
          f: 'json'
        }
      }, function(err, res, body){

        if (err) return doneGetFeatureType(err);

        log('got feature type from arcgis');

        properties = JSON.parse(body);

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

        doneGetFeatureType(null);
      });
  }, function (doneGetFeatureCount){

    // get feature count
    request({
      url: url + '/query',
      qs: {
        where: '1=1',
        returnCountOnly: 'true',
        f: 'json'
      }
    }, function(err, res, body){

      if (err) return doneGetFeatureCount(err);

      // Parse result JSON
      try {
        var result = JSON.parse(body);
      } catch (e) {
        return doneGetFeatureCount({message: 'invalid json for layer count'});
      }
      log('got feature count from arcgis');

      properties.featureCount = result.count;

      doneGetFeatureCount(null);
    });
  }], function(err, result){
    if (err) doneGetArcGisLayerProperties(err)
    else doneGetArcGisLayerProperties(null, properties);
  });
}

function syncArcGisLayerFeatures(hook, doneSyncArcGisLayerFeatures) {
  var Layers = hook.app.service('layers');
  var sequelize = hook.app.get('sequelize');
  var layerId = hook.data.id || hook.id;

  log(layerId + ' is ArcGIS layer');

  Layers.get(layerId, function(err, layer){

    if (err) handleSyncFinishEvent(err, hook, layer);

    // get syncStatus or initiate it, if not defined
    var syncStatus = layer.dataValues.sync || {
      status: 'initiated',
      startedAt: Date.now()
    };

    // Prepare for iteration
    log('features were found');

    var total = layer.dataValues.featureCount;
    var current = 0;
    var perPage = 100;
    var geojson = {};

    // Set layer status to "fetching"
    Layers.patch(layerId, {
      sync: _.extend(syncStatus, {
        status: 'fetching'
      })
    });

    // Start iteration
    async.whilst(
      function() { return current < total; },
      function(doneFeaturesPageRequest) {

        log('requesting features after index '+ current);

        request({
          url: layer.dataValues.url + '/query',
          qs: {
            returnGeometry: true,
            where: '1=1',
            outSR: 3857,
            resultOffset: current,
            resultRecordCount: perPage,
            outFields: '*',
            f: 'geojson'
          }
        }, function(err, res, body) {

          // Check for request errors
          if (err) {
            return doneFeaturesPageRequest(err);
          } else log('success, adding to geojson... ');

          // Parse JSON
          var data = {};
          try {
            data = JSON.parse(body);
          } catch (e) {
            return doneFeaturesPageRequest({message: 'invalid json'})
          }

          // Result should have features
          if (data.features && data.features.length) {

            if (current == 0)
              geojson = data;
            else
              geojson.features = geojson.features.concat(data.features);

          } else {
            return doneFeaturesPageRequest({message: 'no features were found'})
          }

          // Update counter
          current = current + perPage;

          doneFeaturesPageRequest();

        })
      },
      function(err) {

        // Check for errors while request data batch
        if (err) return handleSyncFinishEvent(err, hook);

        log('starting geojson import to database');

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
          domegisId: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, field: 'domegis_id'},
          geometry: { type: Sequelize.GEOMETRY(postgisType, 3857) }
        }

        _.each(layer.dataValues.fields, function(field){
          var fieldType = esriToSequelizeType(field.type);
          if (fieldType) schema[field.name] = { type: fieldType };
        });

        // drop table if exists
        log('drop current table, if exists');
        sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'\";').then(function(){

          // create feature table
          log('create layer feature table');
          var Features = sequelize.define(layerId, schema, {
            timestamps: false,
            freezeTableName: true
          });

          // Remove automatically generated id, if not defined in table
          if (!schema['id']) Features.removeAttribute('id');

          sequelize.sync().then(function(){
            // create feature table
            log('start feature import for ' + layerId);

            // Update layer status
            Layers.patch( layerId, {
              sync: _.extend(syncStatus, {
                status: 'importing',
                featureCount: 0
              })
            });

            // insert features
            async.eachSeries(geojson.features, function(esriFeature, doneEach){

              // ignores features with undefined geometries
              if (!esriFeature.geometry) return doneEach();

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

              // save feature
              Features.create(esriFeature)
                .then(function(){
                  doneEach();
                  return null;
                }).catch(function(err){
                  handleSyncFinishEvent(err, hook)
                });

              return null;
            }, function(err){
              if (err) return handleSyncFinishEvent(err, hook);

              var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layerId +"\"), \"featureCount\" = " + geojson.features.length + "  WHERE (layers.id =  '"+ layerId +"');"
              + "GRANT SELECT ON \""+layerId+"\" TO domegis_readonly;";

              sequelize.query(query).then(function(result){
                generateDatafiles(hook, layer, handleSyncFinishEvent);
              }).catch(function(err){
                handleSyncFinishEvent(err, hook)
              });
            });

            return null;
          }).catch(function(err){
            handleSyncFinishEvent(err, hook)
          });

          return null;
        }).catch(function(err){
          handleSyncFinishEvent(err, hook)
        });
      }
    )
  });
}
