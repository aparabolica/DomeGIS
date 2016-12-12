'use strict';

var debug = require('debug');
var log = debug('domegis:service:layers:derived');

var _ = require('underscore');
var crypto = require('crypto');
var errors = require('feathers-errors');
var handleSyncFinishEvent = require('../common').handleSyncFinishEvent;


module.exports.before = function(hook) {
  return new Promise(function(resolve, reject){
    hook.data.id = crypto.randomBytes(20).toString('hex');
    hook.data.sync.status = 'running';

    if (!hook.data.query)
      reject(new errors.BadRequest('Missing SQL query.'));
    else
      resolve();
  });
}

module.exports.after = function(hook) {

  log('after hook, will start query');

  validateQuery(hook)
    .then(generateDerivedTable)
    .then(function(hook){
      handleSyncFinishEvent(null, hook);
    })
    .catch(function(err){
      handleSyncFinishEvent(err, hook);
    });

}

function validateQuery (hook) {
  return new Promise(function(resolve, reject){
    log('validateQuery');

    var sequelize_readonly = hook.app.get('sequelize_readonly');
    var sql = hook.data.query;

    sequelize_readonly
      .query(sql)
      .then(function(queryResult) {

        var records = queryResult[0];
        var fields = queryResult[1].fields;

        // check is results are valid
        if (records.length == 0)
          return reject(new errors.BadRequest('Query returned no records.'));

        if (fields.length == 0)
          return reject(new errors.BadRequest('Query returned no fields.'));


        var geometryFields = _.filter(fields, function(field){
          return (field.name == 'geometry');
        });

        if (geometryFields.length == 0)
          return reject(new errors.BadRequest('Missing "geometry" field.'));

        if (geometryFields.length != 1)
          return reject(new errors.BadRequest('Multiple "geometry" fields.'));

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
          return reject(new errors.BadRequest('Field name `domegis_id` is forbidden.'));
        }

        resolve(hook);
    }).catch(function(err){
      log('err', err);
      updateLayerStatus(err, hook);
    });
  });
}


function generateDerivedTable (hook) {
  return new Promise(function(resolve, reject){
    log('generateDerivedTable');
    var sequelize = hook.app.get('sequelize');
    var sql = hook.data.query;

    // remove trailing semicolon
    sql = sql.replace(';', '');

    // create table with features
    var createTableQuery = 'SELECT * INTO "'+hook.data.id+'" from ('+sql+') as derived';

    log('createTableQuery:', createTableQuery);

    sequelize
      .query(createTableQuery)
        .then(function(queryResult){

          log('derived created', queryResult);

          // get table description
          sequelize.queryInterface
            .describeTable(hook.data.id)
            .then(function(tableDescription){

              log('updating fields');

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

              resolve(hook);
            })
            .catch(function(err){
              return reject(new errors.GeneralError('Error getting layer description.'));
            });
        })
        .catch(function(err){
          return reject(new errors.GeneralError('Error creating derived layer.'));
        });
  });
}
