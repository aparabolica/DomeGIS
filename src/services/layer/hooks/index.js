'use strict';

var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');
var request = require('request');

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
  create: [],
  update: [],
  patch: [],
  remove: []
};
