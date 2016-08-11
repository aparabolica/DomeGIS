'use strict';

var crypto = require('crypto');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var hooks = require('feathers-hooks');
var request = require('request');
var Sequelize = require('sequelize');
var auth = require('feathers-authentication').hooks;
var errors = require('feathers-errors');
var exec = require('child_process').exec;

var debug = require('debug');
var log = debug('domegis:service:layers');

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

          // remove layer's feature table is exists
          function(doneStep){
            dropLayer(sequelize, hook.data.id, function(err){
              if (err) return reject(err);
              else doneStep();
            })

          },
          function(doneStep){

            if (hook.data.type == 'arcgis'){
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
            } else if (hook.data.type == 'derived') {

              // generate random layer id
              hook.data.id = crypto.randomBytes(20).toString('hex');

              // create feature table for this layer
              generateDerivedLayer(hook, function(err){
                if (err) return reject(err);

                resolve();
              });
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

    // Emit 'layer created' signal
    Layers.emit('created', hook.data);
    log('layer metadata saved, trying to to sync from arcgis');

    var syncStatus = _.clone(hook.data.sync);

    var handleSyncFinishEvent = function(err, data) {
      if (err) {
        log(hook.data.id + ' sync error: ' + err.message);
        syncStatus = _.extend(syncStatus, {
          status: 'failed',
          finishedAt: Date.now(),
          message: err.message
        });
      } else {
        log('success syncing layer ' + hook.data.id);
        syncStatus = _.extend(syncStatus, {
          status: 'finished',
          finishedAt: Date.now()
        });
      }

      Layers.patch(layerId, {
        sync: syncStatus
      }).catch(function(err){
        log(hook.data.id + ' error saving sync status');
      });
    }

    /*
     * Sync ArcGIS Layer
     */

    if (hook.data.type == 'arcgis') {

      log('is ArcGIS layer');

      // Layer should have features
      if (hook.data.featureCount > 0) {

        // Prepare for iteration
        log('features were found');

        var total = hook.data.featureCount;
        var current = 0;
        var perPage = 100;
        var geojson = {};

        // Start iteration
        async.whilst(
          function() { return current < total; },
          function(doneFeaturesPageRequest) {

            log('requesting features after index '+ current);

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

              // Update sync status
              syncStatus = _.extend(syncStatus, {
                status: 'fetching',
                featureCount: geojson.features.length
              });

              // Save changes
              Layers.patch( layerId, {
                sync: syncStatus
              }, doneFeaturesPageRequest);

            })
          },
          function(err) {

            // Check for errors while request data batch
            if (err) return handleSyncFinishEvent(err);

            log('starting importing geojson to database');

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
              geometry: { type: Sequelize.GEOMETRY(postgisType, 4326) }
            }

            _.each(hook.data.fields, function(field){
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
                log('start feature import');

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
                    })
                    .catch(handleSyncFinishEvent);
                }, function(err){
                  if (err) return handleSyncFinishEvent(err);

                  var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layerId +"\"), \"featureCount\" = " + geojson.features.length + "  WHERE (layers.id =  '"+ layerId +"');"
                  + "GRANT SELECT ON \""+layerId+"\" TO domegis_readonly;";

                  sequelize.query(query).then(function(result){
                    generateDatafiles(hook, handleSyncFinishEvent);
                  }).catch(handleSyncFinishEvent);
                });
              }).catch(handleSyncFinishEvent);
            }).catch(handleSyncFinishEvent);
          }
        )
      }
    } else if (hook.data.type == 'derived') {

      /*
       * Sync derived Layer
       */

      //  var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layerId +"\"), \"featureCount\" = (select count(*) from \""+layerId+"\"), \"geometryType\" = (select GeometryType(geometry) from \""+layerId+"\") WHERE (layers.id =  '"+ layerId +"');"
       var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layerId +"\"), \"featureCount\" = (select count(*) from \""+layerId+"\"), \"geometryType\" = (select GeometryType(geometry) from \""+layerId+"\" LIMIT 1) WHERE (layers.id =  '"+ layerId +"');"
       + "ALTER TABLE \""+layerId+"\" ADD COLUMN \"domegis_id\" SERIAL PRIMARY KEY;"
       + "GRANT SELECT ON \""+layerId+"\" TO domegis_readonly;";

       sequelize.query(query).then(function(result){
         generateDatafiles(hook, handleSyncFinishEvent);
       }).catch(handleSyncFinishEvent);
    }
  }],
  update: [],
  patch: [],
  remove: []
};

/*
* Generate layer's datapackage
*/

var generateDatafiles = function(hook, doneGenerateDatafiles) {

  var publicDir = hook.app.get('public');
  var layerId = hook.data.id;
  var dbParams = hook.app.get('windshaftOpts').dbParams;

  if (!hook.data.metadata) hook.data.metadata = {};

  var shpDatapackage = {
    "name": hook.data.name,
    "title": hook.data.metadata.title || "",
    "description": hook.data.metadata.description || "",
    "license": {
      "copyrightText": hook.data.metadata.copyrightText || ""
    },
    "url": hook.data.url,
    "resources": [
      {
        "name": hook.data.id + ".shp",
        "path": hook.data.id + ".shp",
        "schema": {
          "fields": hook.data.fields
        }
      }
    ]
  }

  var csvDatapackage = {
    "name": hook.data.name,
    "title": hook.data.metadata.title || "",
    "description": hook.data.metadata.description || "",
    "license": {
      "copyrightText": hook.data.metadata.copyrightText || ""
    },
    "url": hook.data.url,
    "resources": [
      {
        "name": hook.data.id + ".csv",
        "path": hook.data.id + ".csv",
        "schema": {
          "fields": hook.data.fields
        }
      }
    ]
  }

  // command steps
  var cmds = [
    'mkdir -p '+publicDir+'/downloads',
    'mkdir -p /tmp/domegis/shapefiles',
    'ogr2ogr -overwrite -f "ESRI Shapefile" /tmp/domegis/shapefiles/' + hook.data.id + ' PG:"user=domegis dbname=domegis" ' + hook.data.id,
    'echo \''+ JSON.stringify(shpDatapackage, null, '\t') +'\' > /tmp/domegis/shapefiles/' + hook.data.id + '/datapackage.json',
    'zip -ju '+publicDir+'/downloads/'+hook.data.id+'.shp.zip /tmp/domegis/shapefiles/' + hook.data.id + '/*',
    'rm -rf /tmp/domegis/shapefiles/'+hook.data.id,
    'mkdir -p /tmp/domegis/csvs/' + hook.data.id,
    'ogr2ogr -overwrite -f "CSV" /tmp/domegis/csvs/'+hook.data.id+'/'+hook.data.id+'.csv PG:"user=domegis dbname=domegis" ' + hook.data.id,
    'echo \''+ JSON.stringify(csvDatapackage, null, '\t') +'\' > /tmp/domegis/csvs/' + hook.data.id + '/datapackage.json',
    'zip -ju '+publicDir+'/downloads/'+hook.data.id+'.csv.zip /tmp/domegis/csvs/'+hook.data.id+'/*',
    'rm -rf /tmp/domegis/csvs/'+hook.data.id
  ]

  async.eachSeries(cmds, function(cmd, doneCmd){
    exec(cmd, function(error, stdout, stderr) {
      if (error) return doneCmd(error);
      doneCmd();
    });
  }, function(err){
    if (err) {
      log(err);
      doneGenerateDatafiles({message:'could not generate shapefile'})
    } else doneGenerateDatafiles();
  });
}

function dropLayer(sequelize, layerId, doneResetLayer) {
  sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'\"')
    .then(function(results){
      doneResetLayer();
    }).catch(doneResetLayer);
}

/*
 * Generate a derived layer
 */

function generateDerivedLayer(hook, doneGenerateDerivedLayer) {
  var sequelize = hook.app.get('sequelize');
  var sequelize_readonly = hook.app.get('sequelize_readonly');
  var sql = hook.data.query;



  // a SQL query must be passed
  if (!hook.data.query)
    return doneGenerateDerivedLayer(new errors.BadRequest('Missing SQL query.'));
  // use read-only client to get non-destructive results
  else
    sequelize_readonly
      .query(sql)
      .then(function(queryResult) {

        var records = queryResult[0];
        var fields = queryResult[1].fields;

        // check is results are valid
        if (records.length == 0)
          return doneGenerateDerivedLayer(new errors.BadRequest('Query returned no records.'));
        else if (fields.length == 0)
          return doneGenerateDerivedLayer(new errors.BadRequest('Query returned no fields.'));
        else {

          var geometryFields = _.filter(fields, function(field){
            return (field.name == 'geometry');
          });

          if (geometryFields.length == 0)
            return doneGenerateDerivedLayer(new errors.BadRequest('Missing `geometry` field.'));
          else if (geometryFields.length != 1) {
            return doneGenerateDerivedLayer(new errors.BadRequest('Multiple `geometry` fields.'));
          } else {

            // remove trailing semicolon
            sql = sql.replace(';', '');

            // remove domegis_id field or raise error if is passed
            if (sql.indexOf('*')) {
              var fieldsString = [];
              _.each(fields, function(field){
                if (field.name != 'domegis_id') fieldsString.push('"'+field.name+'"');
              });
              sql = sql.replace('*', fieldsString.join(', '));
            } else if (sql.indexOf('domegis_id')) {
              return doneGenerateDerivedLayer(new errors.BadRequest('Field name `domegis_id` is forbidden.'));
            }

            // create table with features
            var createTableQuery = 'SELECT * INTO "'+hook.data.id+'" from ('+sql+') as derived';
            sequelize
              .query(createTableQuery)
                .then(function(queryResult){

                  // get table description
                  sequelize.queryInterface
                    .describeTable(hook.data.id)
                    .then(function(tableDescription){

                      hook.data.fields = [];

                      // transform description to an array
                      _.each(_.keys(tableDescription), function(key){
                        if (key != 'geometry') {
                          tableDescription[key]['name'] = key;
                          tableDescription[key]['title'] = {
                            "en": key,
                            "es": key,
                            "pt": key
                          };
                          hook.data.fields.push(tableDescription[key]);
                        }
                      });

                      doneGenerateDerivedLayer();
                    })
                    .catch(function(err){
                      return doneGenerateDerivedLayer(new errors.GeneralError('Error getting layer description.'));
                    });
                })
                .catch(function(err){
                  return doneGenerateDerivedLayer(new errors.GeneralError('Error creating derived layer.'));
                })
          }
        }

      })
      .catch(doneGenerateDerivedLayer);
}

/*
 * Convert ArcGIS types
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
