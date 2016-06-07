L.Control.DownloadData = L.Control.extend({

  options: {
    position: 'bottomright'
  },

  initialize: function(options) {
    L.setOptions(this, options);
    this._layers = [];
  },

  onAdd: function() {

    var self = this;

    this._container = L.DomUtil.create('div', 'download-data');

    this._container.innerHTML = '<a href="javascript:void(0);"><span class="fa fa-download"></span> Download data</a>';

    L.DomEvent.disableClickPropagation(this._container);

    L.DomEvent.addListener(this._container, 'click', function() {
      $(self._map._container).find('.download-box').show();
    });

    return this._container;

  },

  addLayer: function(layerObj) {

    this._layers.push({
      layerId: layerObj.layerId,
      title: layerObj.title,
      url: layerObj.url
    });

    return this._update();

  },

  removeLayer: function(layerId) {

    this._layers = _.filter(this._layers, function(layer) {
      return layer.layerId != layerId;
    });

    return this._update();

  },

  _update: function() {

    var $map = $(this._map._container);
    $map.find('.download-box').remove();

    var $download = $('<div class="download-box"><div class="close" /><div class="download-box-content" /></div>');

    this._layers.forEach(function(layer) {
      $download.find('.download-box-content').append('<div class="layer-item clearfix"><h2>' + layer.title + '</h2><a href="' + layer.url + '" target="_self"><span class="fa fa-download"></span> Shapefile</a></div>');
    });

    $download.hide();

    $map.append($download);

    $download.on('click', '.close', function() {
      $download.hide();
    });

    return this;

  }

});

L.control.downloadData = function(options) {
  return new L.Control.DownloadData(options);
}
