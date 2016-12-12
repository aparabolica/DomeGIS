'use strict';

var debug = require('debug');
var log = debug('domegis:service:layers');

var _ = require('underscore');

module.exports.handleSyncFinishEvent = function(err, hook, layer) {
  log('handleSyncFinishEvent');

  try {
    var syncStatus = (hook.data && hook.data.sync) || layer.sync || {};
    var layerId = hook.data.id || layer.id;

    if (err) {
      log(layerId + ' sync error: ' + err.message);
      syncStatus = _.extend(syncStatus, {
        status: 'error',
        finishedAt: Date.now(),
        message: err.message
      });
    } else {
      log('success syncing layer ' + layerId);
      syncStatus = _.extend(syncStatus, {
        status: 'ok',
        finishedAt: Date.now()
      });
    }

    var Layers = hook.app.service('layers');
    Layers.patch(layerId, {
      sync: syncStatus
    }).catch(function(err){
      log(layerId + ' error saving sync status');
    });

  } catch (e) {
      console.log('e');
      console.log(e);
  }
}
