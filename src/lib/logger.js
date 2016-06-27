'use strict';

var _ = require('underscore');
var requestIp = require('request-ip');
var Sequelize = require('sequelize');

var Logger = function (options) {
  var self = this;

  self.options = (options || {});

  var app = self.options.app;
  if (app) {

    // log login attempts
    app.service('/auth/local').before({
      create: [function(hook){
        var clientIp = requestIp.getClientIp(hook.params.req);
        app.info('login attempt from '+ clientIp, {
          event: 'loginAttempt',
          ip: clientIp,
          userId: hook.data.email
        });
        return hook;
      }]
    });

    // log successful logins
    app.service('/auth/local').after({
      create: [function(hook){
        var clientIp = requestIp.getClientIp(hook.params.req);
        app.info('login successful from '+ clientIp, {
          event: 'loginSuccessful',
          ip: clientIp,
          userId: hook.data.email
        });
        return hook;
      }]
    });
  }

  if (!self.options.tableName)
    self.options.tableName = 'log';

  if (!self.options.sequelize)
    throw new Error("Not found sequelize");

  self.model = self.options.sequelize.define(self.options.tableName, {
    level: Sequelize.STRING,
    message: Sequelize.STRING,
    meta: Sequelize.JSON
  }, {
  	timestamps: true,
    createdAt: 'timestamp',
    updatedAt: false,
    indexes: [{
      name: 'level',
      fields: ['level']
    }]
  });
};

Logger.prototype.info = function (message, meta, callback) {
  this.log('info', message, meta, callback);
}

Logger.prototype.log = function (level, message, meta, callback) {
  var self = this;

  try {
    var data = {
      message: message,
      level: level
    }

    if (!meta) {
      meta = {};
    }

    if (typeof meta != 'object') {
      throw new Error("Meta information must be object");
    }

    // remove user hash password
    if (meta.user && meta.user.password)
      delete meta.user.password;

    data.meta = meta;

    self.model.create(data)
      .catch(function (err) {
        console.log('error log');
        console.log(err);
      });

  } catch (e) {
    console.log(e);
  }

};

module.exports = Logger;
