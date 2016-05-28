'use strict';

var globalHooks = require('../../../hooks');
var bcrypt = require('bcryptjs');
var errors = require('feathers-errors');
var hooks = require('feathers-hooks');
var auth = require('feathers-authentication').hooks;

var checkPasswordChange =  function(options){
  options = options || {};
  return function(hook) {
    if (hook.type !== 'before') {
      throw new Error('The \'isChangingPassword\' hook should only be used as a \'before\' hook.');
    }

    options = Object.assign({}, defaults, hook.app.get('auth'), options);

    // ignores when no data is sent
    if (hook.data === undefined) {
      return hook;
    }

    // ignores when password is not changed
    var newPassword = hook.data['password'];
    if (newPassword === undefined) {
      return hook;
    }

    // check if currentPassword is included in the request
    var currentPassword = hook.data['currentPassword'];
    if (currentPassword === undefined) {
      throw new errors.BadRequest('\'currentPassword\' field is missing.');
    }

    // check if current user is populated in the hook
    if (hook.params.user === undefined) {
      throw new Error('Current user should be populated at \'checkPasswordChange\'.');
    } else var user = hook.params.user;

    // check if currentPassword is valid
    crypto.compare(currentPassword, user.password, function(error, result) {
      if (error) throw new Error('Error comparing passwords with bcrypt.');

      if (result) {
        return new Promise(function(resolve, reject){
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(newPassword, salt, function(err, hash) {
              if (err) {
                return reject(err);
              }

              hook.data['password'] = hash;
              resolve(hook);
            });
          });
        });
      } else {
        throw new errors.BadRequest('\'currentPassword\' don\'t match.');
      }
    });
  };
}

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToRoles({ roles: ['admin'] })
  ],
  find: [
  ],
  get: [
  ],
  create: [
    auth.hashPassword()
  ],
  update: [
    auth.populateUser(),
    checkPasswordChange()
  ],
  patch: [
    auth.populateUser(),
    checkPasswordChange()
  ],
  remove: [
  ]
};

exports.after = {
  all: [hooks.remove('password')],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
