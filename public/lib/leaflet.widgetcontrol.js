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
    var container = this._container = $('<div class="map-widgets" />');
    // this._container = L.DomUtil.create('div', 'map-widgets');
    L.DomEvent.disableClickPropagation(this._container[0]);
    L.DomEvent.disableScrollPropagation(this._container[0]);

    var header = $('<div class="map-widgets-header" />');
    header.append('<span class="toggle-icon fa fa-chevron-down" />');
    header.append('<h2><span class="fa fa-info"></span>Map info</h2>');

    header.on('click', function() {
      if(container.hasClass('active')) {
        $(this).find('.toggle-icon')
          .removeClass('fa-chevron-up')
          .addClass('fa-chevron-down');
        $(container.removeClass('active'));
      } else {
        $(this).find('.toggle-icon')
          .removeClass('fa-chevron-down')
          .addClass('fa-chevron-up');
        $(container.addClass('active'));
      }
    });

    this._content = $('<div class="map-widgets-content" />');

    this._container
      .append(header)
      .append(this._content);

    this._update();

    return this._container[0];
  },

  addWidget: function(text, title, layers) {
    if (!text) { return this; }

    if(Object.prototype.toString.call( layers ) === '[object Object]') {
      var layerArr = [];
      for(var key in layers) {
        if(layers[key])
          layerArr.push(key);
      }
      layers = layerArr;
    }

    var widget = {
      div: '',
      title: title || '',
      text: text,
      layers: layers || []
    };

    widget.addLayerEv = function(e) {
      widget.layers.forEach(function(layerId) {
        if(e.layer.options.domegisLayerId == layerId) {
          widget.div.addClass('active');
        }
      });
    };
    widget.removeLayerEv = function(e) {
      widget.layers.forEach(function(layerId) {
        if(e.layer.options.domegisLayerId == layerId) {
          widget.div.removeClass('active');
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

    var control = $(this._container);
    var container = $(this._content);

    if (!this._map) { return this; }

    container.html('');

    var hide = 'none';

    this.widgets.forEach(function(widget) {
      var div = $('<div class="map-widget" />');
      if(widget.title)
        div.append('<h3>' + widget.title + '</h3>');
      div.append(widget.text);
      div.appendTo(container);
      widget.div = div;
      hide = 'block';
      widget.div.addClass('active');
      var mapLayers = [];
      for(var layerKey in self._map._layers) {
        mapLayers.push(self._map._layers[layerKey].options.domegisLayerId);
      }
      widget.layers.forEach(function(layerId) {
        if(mapLayers.indexOf(layerId) == -1) {
          widget.div.removeClass('active');
        }
      });
      self._map.on('layeradd', widget.addLayerEv);
      self._map.on('layerremove', widget.removeLayerEv);
    });

    // hide the control entirely unless there is at least one widget;
    // otherwise there will be a small grey blemish on the map.
    control.css({'display': hide});

    return this;
  }
});

L.control.widget = function(options) {
  return new L.Control.Widget(options);
}
