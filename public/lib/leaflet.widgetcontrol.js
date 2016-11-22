L.Control.Widget = L.Control.extend({

  options: {
    position: 'bottomleft'
  },

  initialize: function(options) {
    L.setOptions(this, options);
    this.widgets = [];
  },

  onAdd: function(map) {
    var self = this;
    this._container = L.DomUtil.create('div', 'map-widgets');
    L.DomEvent.disableClickPropagation(this._container);
    L.DomEvent.disableScrollPropagation(this._container);

    this._update();

    return this._container;
  },

  addWidget: function(text, layers) {
    if (!text) { return this; }

    var widget = {
      div: '',
      text: text,
      layers: layers || []
    };

    widget.addLayerEv = function(e) {
      widget.layers.forEach(function(layer) {
        if(e.layer == layer) {
          $(widget.div).removeClass('concealed');
        }
      });
    };
    widget.removeLayerEv = function(e) {
      widget.layers.forEach(function(layer) {
        if(e.layer == layer) {
          $(widget.div).addClass('concealed');
        }
      });
    };

    this.widgets.push(widget);

    return this._update();
  },

  removeWidget: function(text) {
    var self = this;
    if (!text) { return this; }
    this.widgets = _.filter(this.widgets, function(w) {
      if(w.text == text) {
        self._map.off('layeradd', w.addLayerEv);
        self._map.off('layerremove', w.removeLayerEv);
        return false;
      } else {
        return true;
      }
    });
    return this._update();
  },

  _update: function() {

    var self = this;

    if (!this._map) { return this; }

    this._container.innerHTML = '';
    var hide = 'none';

    this.widgets.forEach(function(widget) {
      var div = L.DomUtil.create('div', 'map-widget', self._container);
      div.innerHTML = widget.text;
      widget.div = div;
      hide = 'block';
      widget.layers.forEach(function(layer) {
        if(layer && !self._map.hasLayer(layer))
          $(widget.div).addClass('concealed');
      });
      self._map.on('layeradd', widget.addLayerEv);
      self._map.on('layerremove', widget.removeLayerEv);
    });


    // hide the control entirely unless there is at least one widget;
    // otherwise there will be a small grey blemish on the map.
    this._container.style.display = hide;

    return this;
  }
});

L.control.widget = function(options) {
  return new L.Control.Widget(options);
}
