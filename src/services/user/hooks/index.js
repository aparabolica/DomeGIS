'use strict';

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

    // generate password hash
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(newPassword, salt);

    // avoid password check if it is a reset operation
    if (hook.params.reset) {
      hook.data['password'] = hash;
      return hook;
    }

    // check if currentPassword is included in the request
    var userPassword = hook.data['userPassword'];
    if (userPassword === undefined || userPassword.length == 0) {
      throw new errors.BadRequest('\'userPassword\' field is missing.');
    }

    // check if userPassword is valid and return
    return new Promise(function(resolve, reject){

      // get user
      var Users = hook.app.service('users');
      Users.get(hook.id).then(function(user){

        // check password
        bcrypt.compare(userPassword, user.password, function(error, result) {
          if (error) return reject(new errors.GeneralError('Error comparing passwords with bcrypt.'));
          else if (result) {

            // success, update password hash
            hook.data['password'] = hash;
            return resolve(hook);
          } else reject(new errors.BadRequest('Current password don\'t match.'));
        });
      }).catch(reject);
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
    // A user can't remove itself
    hooks.disable(function(hook){
      return hook.id != hook.params.user.id;
    })
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
