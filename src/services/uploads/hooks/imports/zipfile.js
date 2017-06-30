"use strict";

var _ = require("underscore");
var Promise = require("bluebird");
var exec = require("child_process").exec;
var log = require("debug")("domegis:service:uploads");

// promise helper
function promiseFromChildProcess(child) {
  return new Promise(function(resolve, reject) {
    child.addListener("error", reject);
    child.addListener("exit", resolve);
  });
}

module.exports = function(hook) {
  var filePath = hook.params.file.path;
  var unzipPath = hook.params.file.path + ".zip/";
  var layer = _.clone(hook.result.layer);
  var Layers = hook.app.service("layers");
  var fields = {};

  var dbParams = hook.app.get("windshaftOpts").dbParams;
  var pgConnectionString =
    '"PG:host=' +
    dbParams.dbhost +
    " user=" +
    dbParams.dbuser +
    " dbname=" +
    dbParams.dbname +
    " password=" +
    dbParams.dbpassword +
    '"';

  function unzipFile() {
    var cmd = "unzip -o -d " + unzipPath + " " + filePath;
    return promiseFromChildProcess(exec(cmd));
  }

  function zipToPostgresql() {
    var cmd =
      'ogr2ogr --config PG_USE_COPY YES -f "PostgreSQL" ' +
      pgConnectionString +
      ' "' +
      unzipPath +
      '" -t_srs "EPSG:3857" -lco GEOMETRY_NAME=geometry -lco FID=gid -lco PRECISION=no -nlt PROMOTE_TO_MULTI -nln ' +
      layer.id +
      " -overwrite";
    return promiseFromChildProcess(exec(cmd));
  }

  function updateLayerMeta() {
    return new Promise(function(resolve, reject) {
      var sequelize = hook.app.get("sequelize");
      var query =
        'UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM "' +
        layer.id +
        '"), "featureCount" = (select count(*) from "' +
        layer.id +
        '"), "geometryType" = (select GeometryType(geometry) from "' +
        layer.id +
        "\" LIMIT 1) WHERE (layers.id =  '" +
        layer.id +
        "');" +
        'ALTER TABLE "' +
        layer.id +
        '" RENAME COLUMN "gid" to "domegis_id";' +
        'GRANT SELECT ON "' +
        layer.id +
        '" TO domegis_readonly;';

      sequelize
        .query(query)
        .then(function(result) {
          resolve();
        })
        .catch(reject);
    });
  }

  function getFields() {
    return new Promise(function(resolve, reject) {
      var sequelize = hook.app.get("sequelize");
      var query =
        "select column_name as name, data_type as type, character_maximum_length as length from INFORMATION_SCHEMA.COLUMNS where table_name = '" +
        layer.id +
        "';";

      sequelize
        .query(query)
        .then(function(result) {
          // prepare fields
          fields = _.map(result[0], function(field) {
            // translate field type
            switch (field.type) {
              case "character varying":
                field.type = "esriFieldTypeString";
                break;
              case "integer":
                field.type = "esriFieldTypeInteger";
                break;
              case "double":
                field.type = "esriFieldTypeDouble";
                break;
            }

            // localization
            field.title = {
              en: field.name,
              es: field.name,
              pt: field.name
            };
            return field;
          });

          // discard geometry
          fields = _.reject(fields, function(field) {
            return field.type == "USER-DEFINED";
          });

          resolve();
        })
        .catch(function(err) {
          console.log("err", err);
        });
    });
  }

  function updateLayerStatus(err) {
    if (err) {
      console.log(err);
      layer.sync.status = "error";
      layer.sync.message = err.message;
    } else {
      layer.sync.status = "imported";
    }

    layer.sync.finishedAt = Date.now();

    // update layer
    Layers.patch(layer.id, {
      metadata: layer.metadata,
      fields: fields,
      sync: layer.sync
    }).catch(function(err) {
      log(layer.id + " error saving raster import status");
    });
  }

  unzipFile()
    .then(zipToPostgresql)
    .then(updateLayerMeta)
    .then(getFields)
    .then(updateLayerStatus)
    .catch(updateLayerStatus);

  return hook;
};
