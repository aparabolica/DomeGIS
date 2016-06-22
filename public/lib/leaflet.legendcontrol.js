L.Control.Legend = L.Control.extend({

  options: {
    position: 'bottomright'
  },

  initialize: function(options) {
    L.setOptions(this, options);
    this._legends = {};
  },

  onAdd: function(map) {
    var self = this;
    this._container = L.DomUtil.create('div', 'map-legends wax-legends');
    L.DomEvent.disableClickPropagation(this._container);

    $(map._container).on('click', '.map-legend', function() {
      var layers = self._legends[$(this).html()];
      if($(this).hasClass('concealed')) {
        $(this).removeClass('concealed');
        layers.forEach(function(layer) {
          if(layer && !map.hasLayer(layer))
            map.addLayer(layer);
        });
      } else {
        $(this).addClass('concealed');
        layers.forEach(function(layer) {
          if(layer && map.hasLayer(layer))
            map.removeLayer(layer);
        });
      }
    });

    this._update();

    return this._container;
  },

  addLegend: function(text, layers) {
    if (!text) { return this; }

    if (!this._legends[text]) {
      this._legends[text] = layers;
    }

    // this._legends[text]++;
    return this._update();
  },

  removeLegend: function(text) {
    if (!text) { return this; }
    if (this._legends[text]) this._legends[text] = 0;
    return this._update();
  },

  _update: function() {

    var self = this;

    if (!this._map) { return this; }

    this._container.innerHTML = '';
    var hide = 'none';

    for (var i in this._legends) {
      if (this._legends.hasOwnProperty(i) && this._legends[i]) {
        var div = L.DomUtil.create('div', 'map-legend wax-legend', this._container);
        div.innerHTML = i;
        hide = 'block';
        this._legends[i].forEach(function(layer) {
          if(layer && !self._map.hasLayer(layer))
            $(div).addClass('concealed');
        });
      }
    }

    // hide the control entirely unless there is at least one legend;
    // otherwise there will be a small grey blemish on the map.
    this._container.style.display = hide;

    return this;
  }
});

L.control.legend = function(options) {
  return new L.Control.Legend(options);
}
