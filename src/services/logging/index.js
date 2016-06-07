'use strict';

var moment = require('moment-timezone');
var csvStringify = require('csv-stringify');
var auth = require('feathers-authentication').hooks;
var errors = require('feathers-errors');

module.exports = function(){
  var app = this;

  var Layers = app.service('layers');
  var sequelize = app.get('sequelize');


  app.use('/admin/logs.csv', {
    find: function(params){
      return new Promise(function(resolve, reject){
        var results = [['timestamp', 'id', 'event', 'user_id', 'level', 'message']];
        var query = "SELECT * FROM logs ORDER BY timestamp ASC";
        sequelize.query(query)
          .then(function(queryResult){
            queryResult[0].forEach(function(item){
              var time = moment(item.timestamp);
              results.push([moment().tz("Brazil/East").format(), item.id, item.meta.event, item.meta.userId, item.level, item.message]);
            });
            csvStringify(results, function(err, csv){
              if (err) return reject(new errors.GeneralError('Error while parsing logs.'));
              else resolve(csv);
            });
          }).catch(function(err){
            if (err) return reject(new errors.GeneralError('Error while parsing logs.'));
          });

      });
    }
  });

  app.service('/admin/logs.csv').before({
    all: [
      auth.verifyToken(),
      auth.restrictToAuthenticated(),
      auth.restrictToRoles({ roles: ['admin'] })
    ]
  });
};
