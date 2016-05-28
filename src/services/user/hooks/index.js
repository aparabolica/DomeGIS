'use strict';

var globalHooks = require('../../../hooks');
var bcrypt = require('bcryptjs');
var errors = require('feathers-errors');
var hooks = require('feathers-hooks');
var auth = require('feathers-authentication').hooks;

var checkPasswordChange =  function(){
  return function(hook) {
    if (hook.type !== 'before') {
      throw new errors.GeneralError('The \'isChangingPassword\' hook should only be used as a \'before\' hook.');
    }

    // ignores when no data is sent
    if (hook.data === undefined) {
      return hook;
    }

    // ignores when password is not changed
    var newPassword = hook.data['password'];
    if (newPassword === undefined) {
      return hook;
    } else if (newPassword.length < 5) {
      throw new errors.BadRequest('Password should have at least 5 characters.');
    }

    // check if currentPassword is included in the request
    var userPassword = hook.data['userPassword'];
    if (userPassword === undefined || userPassword.length == 0) {
      throw new errors.BadRequest('\'userPassword\' field is missing.');
    }

    // check if current user is populated in the hook
    if (hook.params.user === undefined) {
      throw new errors.BadRequest('Current user should be populated at \'checkPasswordChange\'.');
    } else var user = hook.params.user;

    // check if userPassword is valid
    // var crypto = hook.app.get('auth').crypto;
    return new Promise(function(resolve, reject){
      bcrypt.compare(userPassword, user.password, function(error, result) {
        if (error) return reject(new errors.GeneralError('Error comparing passwords with bcrypt.'));

        if (result) {
            bcrypt.genSalt(10, function(err, salt) {
              bcrypt.hash(newPassword, salt, function(err, hash) {
                if (err) {
                  return reject(err);
                }

                hook.data['password'] = hash;
                resolve(hook);
              });
            });
        } else {
          reject(new errors.BadRequest('\'userPassword\' don\'t match.'));
        }
      });
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
