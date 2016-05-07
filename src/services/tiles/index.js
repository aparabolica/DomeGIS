'use strict';

/*
 * Modules
 */

var RedisPool = require('redis-mpool');
var mapnik = require('mapnik');
var windshaft = require('windshaft');
var MapController = require('./controllers/map');

/*
 * Exports service
 */

global = {}

/*
 * Exports service
 */

module.exports = function() {
  var app = this;

  /*
   * Load options
   */

  var opts = app.get('windshaftOpts');

  // set mapnik version in runtime
  opts.grainstore = {
    mapnik_version: mapnik.versions.mapnik,
    datasource: { srid: 4326 }
  }

  // set global needed by windshaft
  global = opts.global;

  /*
   * Register fonts for Mapnik
   */

  mapnik.register_system_fonts();
  mapnik.register_default_fonts();

  /*
   * Configure MapStore in Redis
   */

  var mapStore  = new windshaft.storage.MapStore({
    pool: new RedisPool(opts.redis),
    expire_time: opts.layergroup_ttl
  });

  /*
   * Init renderer
   */

  var rendererFactory = new windshaft.renderer.Factory({
   mapnik: {
     grainstore: opts.grainstore
   }
  });
  var rendererCache = new windshaft.cache.RendererCache(rendererFactory, opts.rendererCache);

  /*
   * Init map related backend
   */

  var attributesBackend = new windshaft.backend.Attributes();
  var previewBackend = new windshaft.backend.Preview(rendererCache);
  var tileBackend = new windshaft.backend.Tile(rendererCache);
  var mapValidatorBackend = new windshaft.backend.MapValidator(tileBackend, attributesBackend);
  var mapBackend = new windshaft.backend.Map(rendererCache, mapStore, mapValidatorBackend);

  /*
   * Init controller
   */
  var mapController = new MapController(app, mapStore, mapBackend, tileBackend, attributesBackend);

};
