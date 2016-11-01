'use strict';

var dauria = require('dauria');
var hooks = require('feathers-hooks-common');

exports.before = {
  create: [
    function(hook) {
      if (!hook.data.uri && hook.params.file){
        var file = hook.params.file;
        var uri = dauria.getBase64DataURI(file.buffer, file.mimetype);
        hook.data = {uri: uri};
      }
    }
  ]
}

exports.after = {
  create: [
    hooks.pluck('id', 'size')
  ]
}
