angular.module('domegis')

.directive('contentThumbnail', [
  function() {
    return {
      restrict: 'E',
      scope: {
        content: '='
      },
      replace: true,
      template: '<img class="thumbnail" ng-src="{{src}}" />',
      link: function(scope, element, attrs) {
        scope.$watch('content', function(content) {
          if(content) {
            scope.src = arcgis.getApiRoot() + '/content/items/' + (content.id || content._id) + '/info/' + (content.data ? content.data.thumbnail : content.thumbnail);
          }
        }, true);
      }
    }
  }
])

.directive('domeMap', [
  '$q',
  '$state',
  'Server',
  'Lang',
  function($q, $state, Server, Lang) {
    return {
      restrict: 'A',
      scope: {
        views: '=domeMap',
        base: '=',
        preview: '='
      },
      replace: true,
      template: '<div id="map"></div>',
      link: function(scope, element, attrs) {

        var layerService = Server.service('layers');
        var viewService = Server.service('views');

        var loc = getStateLoc();

        var center = [0,0];
        var zoom = 2;

        if(loc.length) {
          center = [loc[0], loc[1]];
          zoom = loc[2];
        }

        var map = L.map('map', {
          center: center,
          zoom: zoom,
          fullscreenControl: true
        });

        var legendControl = L.control.legend();
        map.addControl(legendControl);

        map.on('move', function() {
          $state.go($state.current.name, {loc: getLocStr()}, {notify: false})
        });

        map.addLayer(L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));

        var layers = [];

        scope.$watch('views', updateLayers, true);

        scope.$on('updateLayers', function() {
          updateLayers(scope.views);
        });

        var mapBounds;

        function updateLayers(views) {
          layers.forEach(function(layer) {
            if(layer.grid)
              map.removeLayer(layer.grid);
            map.removeLayer(layer.tile);
            legendControl.removeLegend(layer.legend);
          });
          layers = [];
          if(views && views.length) {
            var promises = [];
            views.forEach(function(id) {
              promises.push(Server.get(viewService, id));
            });
            $q.all(promises).then(function(data) {
              data.forEach(addView);
            });
          }
        }

        function addView(view) {
          var layer = {};
          var url = '/tiles/' + view.id + '/{z}/{x}/{y}.png';
          var gridUrl = '/tiles/' + view.id + '/{z}/{x}/{y}.grid.json';
          if(scope.preview) {
            url += '?preview=true&time=' + Date.now();
            gridUrl += '?preview=true&time=' + Date.now();
          }
          layer.tile = L.tileLayer(url);
          map.addLayer(layer.tile);
          if(view.fields && view.fields.length) {
            layer.grid = new L.UtfGrid(gridUrl, {
              useJsonP: false
            });
            layer.grid.on('click', function(e) {
              if(e.data) {
                var popup = L.popup()
                  .setLatLng(e.latlng)
                  .setContent(getTooltipHtml(e.data, e.target._dm_fields))
                  .openOn(map);
              }
            });
            map.addLayer(layer.grid);
          }
          layers.push(layer);
          Server.get(layerService, view.layerId).then(function(l) {
            if(!getStateLoc().length && l.extents) {
              var bounds = parseBounds(l.extents);
              if(mapBounds)
                mapBounds.extend(bounds);
              else
                mapBounds = bounds;
              map.fitBounds(mapBounds);
            }
            layer.legend = getViewLegend(view, l);
            layer.grid._dm_fields = l.fields;
            legendControl.addLegend(layer.legend);
          });
        }

        function getTooltipHtml(data, fields) {
          var html = '<div class="tooltip-content">';
          for(var key in data) {
            html += '<h2>' + getLabel(key, fields) + '</h2>';
            html += '<p>' + data[key] + '</p>';
          }
          html += '</div>';
          return html;
        }

        function getLabel(key, fields) {
          var lang = Lang.get();
          var field = _.find(fields, function(f) {
            return f.name == key;
          });
          return field.title[lang];
        }

        function parseBounds(pgBounds) {
          var bounds = pgBounds.replace('BOX(', '').replace(')', '').split(',');
          return L.latLngBounds(bounds[1].split(' ').reverse(), bounds[0].split(' ').reverse());
        }

        function getViewLegend(view, layer) {

          var layerType;

          var style = _.find(view.style, function(style, type) {
            var isStyle = layer.geometryType.toLowerCase().indexOf(type) !== -1;
            if(isStyle) {
              layerType = type;
              return true;
            } else {
              return false;
            }
          });

          var clss = '';
          if(layerType == 'polygon') {
            clss = 'sqr';
          } else if(layerType == 'point') {
            clss = 'pnt';
          } else if(layerType == 'linestring') {
            clss = 'ln';
          }

          var bgColor = style.fill.color;
          var bgOpacity = style.fill.opacity;

          var stroke = '0';
          var strokeColor = 'transparent';
          if(style.stroke) {
            stroke = style.stroke.width + 'px';
            strokeColor = style.stroke.color;
          }

          var html = '<div id="legend-' + view.id + '">';
          html += '<p class="item">';
          html += '<span class="' + clss + ' feat-ref" style="background:' + bgColor + ';opacity:' + bgOpacity + ';border-color:' + strokeColor + ';border-width:' + stroke + ';"></span>';
          html += layer.name;
          html += '</p>';
          html += '</div>';
          return html;
        }

        function getLocStr() {
          var center = map.getCenter();
          var zoom = map.getZoom();
          var loc = [];
          loc.push(center.lat);
          loc.push(center.lng);
          loc.push(zoom);
          return loc.join(',');
        }

        function getStateLoc() {
          if($state.params.loc)
            return $state.params.loc.split(',');
          else
            return [];
        }

      }
    }
  }
])

.directive('fixToBottom', [
  function() {
    return {
      restrict: 'AC',
      link: function(scope, element, attrs) {
        $(window).resize(function() {
          var top = $(element).offset().top;
          var height = $(window).height();
          $(element).height(height-top);
        });
        $(window).resize();
      }
    }
  }
]);
