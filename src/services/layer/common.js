'use strict';

var debug = require('debug');
var log = debug('domegis:service:layers');

var _ = require('underscore');

module.exports.handleSyncFinishEvent = function(err, hook, layer) {
  log('handleSyncFinishEvent');

  try {
    var patchData = {
      sync: (hook.data && hook.data.sync) || layer.sync || {}
    }
    var layerId = hook.data.id || layer.id;

    if (err) {
      log(layerId + ' sync error: ' + err.message);
      patchData.sync = _.extend(patchData.sync, {
        status: 'error',
        finishedAt: Date.now(),
        message: err.message
      });
    } else {
      log('success syncing layer ' + layerId);
      patchData.sync = _.extend(patchData.sync, {
        status: 'ok',
        finishedAt: Date.now()
      });
    }

    if (hook.data.fields) {
      patchData.fields = hook.data.fields
    }

    var Layers = hook.app.service('layers');
    Layers
      .patch(layerId, patchData)
      .catch(function(err){
        log(layerId + ' error saving sync status');
      });

  } catch (e) {
      console.log('e');
      console.log(e);
  }
}
