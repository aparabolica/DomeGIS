"use strict";

/*
 * Modules
 */

var _ = require("underscore");
var async = require("async");
var step = require("step");
var windshaft = require("windshaft");

var MapConfig = windshaft.model.MapConfig;
var DummyMapConfigProvider = require("windshaft/lib/windshaft/models/providers/dummy_mapconfig_provider");
var MapStoreMapConfigProvider = windshaft.model.provider.MapStoreMapConfig;

/*
 * Constructor
 */

function MapController(
  app,
  mapStore,
  mapBackend,
  tileBackend,
  attributesBackend
) {
  var self = this;
  var opts = app.get("windshaftOpts");

  self._app = app;
  self.dbParams = app.get;
  self.mapStore = mapStore;
  self.mapBackend = mapBackend;
  self.tileBackend = tileBackend;
  self.attributesBackend = attributesBackend;

  app.get(opts.baseUrl + "/:token/:z/:x/:y.(:format)", self.tile.bind(self));

  var viewService = app.service("views");

  // init views when server is restarted
  viewService
    .find({ paginate: false })
    .then(function(views) {
      _.each(views, function(view) {
        self.getLayerGroupId(view, function(err, layergroupIds) {
          if (err) return console.log(err);
          view = _.extend(view, layergroupIds);
          view.save();
        });
      });
    })
    .catch(function(err) {
      console.log("error while regenerating views", err);
    });
}

MapController.prototype.getLayerGroupId = function(view, doneGetLayerGroupId) {
  var self = this;
  var layerService = self._app.service("layers");

  // check for layer existence
  layerService
    .get(view.layerId)
    .then(function() {
      createLayergroupId(doneGetLayerGroupId);
    })
    .catch(function() {
      doneGetLayerGroupId();
    });

  function createLayergroupId(doneCreateLayerGroupId) {
    var opts = self._app.get("windshaftOpts");

    var dbParams = opts.dbParams;

    var mapnikLayer = {
      type: "mapnik",
      options: {}
    };

    if (view.type == "vector") {
      var defaultCartoCSS =
        "#style { polygon-fill: blue;  line-color: red; marker-width:8; marker-fill: red; }";

      var fields = view.fields || [];

      // clone fields property
      var selectedFields = JSON.parse(JSON.stringify(fields));

      // add field selected for category/cloropeth
      if (view.style.column) {
        selectedFields.push(view.style.column.name);
        selectedFields = _.uniq(selectedFields);
      }

      // merge then as a string
      var fieldsStr = "";
      if (selectedFields.length > 0) {
        fieldsStr =
          "," +
          _.map(selectedFields, function(f) {
            return '"' + f + '"';
          }).join(",");
      }

      mapnikLayer.options = {
        sql:
          "select domegis_id, geometry " +
            fieldsStr +
            ' from "' +
            view.layerId +
            '"',
        geom_column: "geometry",
        cartocss_version: "3.0.12",
        interactivity: view.fields,
        cartocss: view.cartocss || defaultCartoCSS
      };

      // raster
    } else if (view.type == "raster") {
      mapnikLayer.options = {
        sql: 'select * from "' + view.layerId + '"',
        geom_column: "the_geom",
        geom_type: "raster",
        raster_band: view.style.raster.band,
        cartocss: view.cartocss || "#style { raster-opacity: 1; }",
        cartocss_version: "3.0.12"
      };
    } else return doneCreateLayerGroupId({ message: "Layer type undefined" });

    try {
      var mapConfig = MapConfig.create({
        version: "1.2.0",
        layers: [mapnikLayer]
      });
    } catch (e) {
      console.log("e");
      console.log(e);
    } finally {
    }

    self.mapBackend.createLayergroup(
      mapConfig,
      dbParams,
      new DummyMapConfigProvider(mapConfig, dbParams),
      function(err, res) {
        if (err) {
          console.log(err);
          doneCreateLayerGroupId(err);
        } else doneCreateLayerGroupId(null, res.layergroupid);
      }
    );
  }
};

// Gets a tile for a given token and set of tile ZXY coords. (OSM style)
MapController.prototype.tile = function(req, res) {
  this.tileOrLayer(req, res);
};

// Gets a tile for a given token, layer set of tile ZXY coords. (OSM style)
MapController.prototype.layer = function(req, res, next) {
  if (req.params.token === "static") {
    return next();
  }
  this.tileOrLayer(req, res);
};

MapController.prototype.tileOrLayer = function(req, res) {
  var self = this;

  var opts = self._app.get("windshaftOpts");

  var params = _.extend(req.params, opts.dbParams);

  step(
    function mapController$getTile(err) {
      if (err) {
        throw err;
      }
      self.tileBackend.getTile(
        new MapStoreMapConfigProvider(self.mapStore, params),
        params,
        this
      );
    },
    function mapController$finalize(err, tile, headers) {
      self.finalizeGetTileOrGrid(err, req, res, tile, headers);
    }
  );
};

// This function is meant for being called as the very last
// step by all endpoints serving tiles or grids
MapController.prototype.finalizeGetTileOrGrid = function(
  err,
  req,
  res,
  tile,
  headers
) {
  if (err) {
    console.log(err);

    // See https://github.com/Vizzuality/Windshaft-cartodb/issues/68
    var errMsg = err.message ? "" + err.message : "" + err;

    // Rewrite mapnik parsing errors to start with layer number
    var matches = errMsg.match("(.*) in style 'layer([0-9]+)'");
    if (matches) {
      errMsg = "style" + matches[2] + ": " + matches[1];
    }
    res.status(400).send({ errors: ["" + errMsg] });
  } else {
    headers["Cache-Control"] = "max-age=21600";
    for (var header in headers) {
      res.set(header, headers[header]);
    }
    res.status(200).send(tile);
  }
};

module.exports = MapController;
