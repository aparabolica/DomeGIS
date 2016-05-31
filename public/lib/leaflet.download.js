L.Control.DownloadData = L.Control.extend({

    options: {
        position: 'bottomright'
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this._legends = {};
    },

    onAdd: function() {
        this._container = L.DomUtil.create('div', 'download-data');

        this._container.innerHTML = '<a href="#"><span class="fa fa-download"></span> Download data</a>';

        L.DomEvent.disableClickPropagation(this._container);

        return this._container;
    }
});

L.control.downloadData = function(options) {
  return new L.Control.DownloadData(options);
}
