'use strict';

/*
 * Modules
 */

var _ = require('underscore');
var async = require('async');
var step = require('step');
var windshaft = require('windshaft');


var MapConfig = windshaft.model.MapConfig;
var DummyMapConfigProvider = require('windshaft/lib/windshaft/models/providers/dummy_mapconfig_provider');
var MapStoreMapConfigProvider = windshaft.model.provider.MapStoreMapConfig;


/*
 * Constructor
 */

function MapController(app, mapStore, mapBackend, tileBackend, attributesBackend) {
  var self = this;
  var opts = app.get('windshaftOpts')

  self._app = app;
  self.dbParams = app.get
  self.mapStore = mapStore;
  self.mapBackend = mapBackend;
  self.tileBackend = tileBackend;
  self.attributesBackend = attributesBackend;

  app.get(opts.baseUrl + '/:viewId/:z/:x/:y.(:format)', self.tile.bind(self));

  var viewService = app.service('views');

  viewService.find({}).then(function(views){
    _.each(views.data, function(view){
      self.getLayerGroupId(view, function(err, layergroupIds){
        if (err) return console.log(err);
        view = _.extend(view, layergroupIds);
        view.save();
      })
    });
  })
}

MapController.prototype.getLayerGroupId = function(view, doneGetLayerGroupId) {
  var self = this;

  var opts = self._app.get('windshaftOpts');

  var dbParams = opts.dbParams;

  var defaultCartoCSS = "#style{ polygon-fill: blue;  line-color: red; marker-width:8; marker-fill: red; }";

  var fields = view.fields || [];

  var fieldsStr = '';
  if (fields.length > 0) {
    fieldsStr = ',' + _.map(fields, function(f){ return '"'+f+'"' }).join(',');
  }

  async.series([ function(doneEach){
    // preview
    var mapnikLayer = {
      type: 'mapnik',
      options: {
        sql: 'select id, geometry '+ fieldsStr +' from "' + view.layerId + 's"',
        geom_column: "geometry",
        cartocss_version: "2.0.0",
        interactivity: fields,
        cartocss: view.previewCartoCss || view.cartocss || defaultCartoCSS
      }
    }

    var mapConfig = MapConfig.create({
      version: '1.2.0',
      layers: [ mapnikLayer ]
    });

    self
      .mapBackend
      .createLayergroup(mapConfig, dbParams, new DummyMapConfigProvider(mapConfig, dbParams), function(err, res){
        if (err) doneEach(err)
        else doneEach(null, res.layergroupid);
      });
  }, function(doneEach){

    // view
    var mapnikLayer = {
      type: 'mapnik',
      options: {
        sql: 'select id, geometry '+ fieldsStr +' from "' + view.layerId + 's"',
        geom_column: "geometry",
        cartocss_version: "2.0.0",
        interactivity: fields,
        cartocss: view.cartocss || defaultCartoCSS
      }
    }

    var mapConfig = MapConfig.create({
      version: '1.2.0',
      layers: [ mapnikLayer ]
    });

    self
      .mapBackend
      .createLayergroup(mapConfig, dbParams, new DummyMapConfigProvider(mapConfig, dbParams), function(err, res){
        if (err) doneEach(err)
        else doneEach(null, res.layergroupid);
      });
  }], function(err, results){
    if (err) return doneGetLayerGroupId(err);
    doneGetLayerGroupId(null, {
      previewLayergroupId: results[0],
      layergroupId: results[1]
    });
  });

}

// Gets a tile for a given token and set of tile ZXY coords. (OSM style)
MapController.prototype.tile = function(req, res) {
  this.tileOrLayer(req, res);
};

// Gets a tile for a given token, layer set of tile ZXY coords. (OSM style)
MapController.prototype.layer = function(req, res, next) {
  if (req.params.token === 'static') {
    return next();
  }
  this.tileOrLayer(req, res);
};

MapController.prototype.tileOrLayer = function (req, res) {
  var self = this;
  var views = self._app.service('views');

  views.get(req.params.viewId).then(function(view){

    var opts = self._app.get('windshaftOpts');

    var params = _.extend(req.params, opts.dbParams);

    if (req.query.preview) {
      params.token = view.previewLayergroupId;
    } else {
      params.token = view.layergroupId;
    }

    step(
      function mapController$getTile(err) {
        if ( err ) {
          throw err;
        }
        self.tileBackend.getTile(new MapStoreMapConfigProvider(self.mapStore, params), params, this);
      },
      function mapController$finalize(err, tile, headers) {
        self.finalizeGetTileOrGrid(err, req, res, tile, headers);
        return null;
      },
      function finish(err) {
        if ( err ) {
          console.error("windshaft.tiles: " + err);
        }
      }
    );
  }).catch(function(err){
    console.log('error'+err);
  });
};

// This function is meant for being called as the very last
// step by all endpoints serving tiles or grids
MapController.prototype.finalizeGetTileOrGrid = function(err, req, res, tile, headers) {
  if (err){
    console.log(err);


    // See https://github.com/Vizzuality/Windshaft-cartodb/issues/68
    var errMsg = err.message ? ( '' + err.message ) : ( '' + err );

    // Rewrite mapnik parsing errors to start with layer number
    var matches = errMsg.match("(.*) in style 'layer([0-9]+)'");
    if (matches) {
      errMsg = 'style'+matches[2]+': ' + matches[1];
    }

    this._app.sendError(res, { errors: ['' + errMsg] }, this._app.findStatusCode(err), 'TILE', err);
  } else {
    for(var header in headers) {
      res.set(header, headers[header]);
    }
    res.status(200).send(tile);
  }
};

module.exports = MapController;
