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
  '$http',
  '$state',
  '$filter',
  'Server',
  'Lang',
  function($q, $http, $state, $filter, Server, Lang) {
    return {
      restrict: 'A',
      scope: {
        views: '=domeMap',
        base: '=',
        feature: '=',
        preview: '='
      },
      replace: true,
      template: '<div id="map"></div>',
      link: function(scope, element, attrs) {

        var layerService = Server.service('layers');
        var viewService = Server.service('views');
        var previewService = Server.service('previews');

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
          fullscreenControl: true,
          scrollWheelZoom: self == top
        });

        var downloadControl = L.control.downloadData();
        map.addControl(downloadControl);

        var legendControl = L.control.legend();
        map.addControl(legendControl);


        map.on('move', _.debounce(function() {
          $state.go($state.current.name, {loc: getLocStr()}, {notify: false})
        }, 400));


        var baseLayers = [];

        if(scope.base == 'infoamazonia') {

          baseLayers.push('http://{s}.tiles.mapbox.com/v3/infoamazonia.AndesAguaAmazonia_relevo_12AmzRaisg,infoamazonia.AndesAguaAmazonia_relevo_11AmzRaisg,infoamazonia.AndesAguaAmazonia_relevo1-10/{z}/{x}/{y}.png');

          baseLayers.push('http://{s}.tiles.mapbox.com/v3/infoamazonia.naturalEarth_baltimetria/{z}/{x}/{y}.png');

          baseLayers.push('http://{s}.tiles.mapbox.com/v3/infoamazonia.rivers/{z}/{x}/{y}.png');

          baseLayers.push('http://{s}.tiles.mapbox.com/v3/infoamazonia.AAA_pois,infoamazonia.osm-brasil/{z}/{x}/{y}.png');

        } else {

          baseLayers.push('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

        }

        baseLayers.forEach(function(url) {
          map.addLayer(L.tileLayer(url));
        });

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
            downloadControl.removeLayer(layer.layerId);
          });
          layers = [];
          if(views && views.length) {
            var promises = [];
            views.forEach(function(id) {
              promises.push(Server.get(previewService, id));
            });
            $q.all(promises).then(function(data) {
              data.forEach(addView);
            });
          }
        }

        function addView(view) {
          var layer = {};
          layer.layerId = view.layerId;
          layer.id = view.id;
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

          var featureBounds = false;
          var doneFeature = $q.defer();

          // get feature bounds
          if(scope.feature && scope.feature.length && scope.feature[0] && scope.feature[1]) {
            $http.get('/layers/' + scope.feature[0] + '/feature/' + scope.feature[1]).then(function(res) {
              featureBounds = res.data.extents;
              map.fitBounds(parseBounds(featureBounds));
              doneFeature.resolve();
            }, function(err) {
              doneFeature.resolve()
            });
          } else {
            doneFeature.resolve();
          }

          doneFeature.promise.then(function() {
            Server.get(layerService, view.layerId).then(function(l) {
              if(!featureBounds) {
                if(!getStateLoc().length && l.extents) {
                  var bounds = parseBounds(l.extents);
                  if(mapBounds)
                    mapBounds.extend(bounds);
                  else
                    mapBounds = bounds;
                  map.fitBounds(mapBounds);
                }
              }
              layer.legend = getViewLegend(view, l);
              if(layer.grid) {
                layer.grid._dm_fields = l.fields;
              }
              legendControl.addLegend(layer.legend);
              downloadControl.addLayer({
                layerId: l.id,
                title: $filter('translate')(l.name),
                url: '/downloads/' + l.id + '.shp.zip'
              });
            });
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

          var name = $filter('translate')(layer.name);

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

          var stroke = '0';
          var strokeColor = 'transparent';
          if(style.stroke) {
            stroke = style.stroke.width + 'px';
            strokeColor = 'rgba(' + chroma(style.stroke.color).rgb().join(',') + ', ' + style.stroke.opacity + ')';
          }

          var bgColor = 'rgba(' + chroma(style.fill.color).rgb().join(',') + ', ' + style.fill.opacity + ')';

          if(view.style.column) {
            if(view.style.type == 'category') {
              if(view.style.category[view.style.column.name]) {
                var catStyle = view.style.category[view.style.column.name];
                var columnName = _.find(layer.fields, function(field) {
                  return field.name == view.style.column.name;
                }).title[Lang.get()];
              }
            }
            if(view.style.type == 'choropleth') {
              if(view.style.choropleth && view.style.choropleth[view.style.column.name]) {
                var cPlethStyle = view.style.choropleth[view.style.column.name];
                var categories = quantiles(view.style.column.values, cPlethStyle.bucket_size || 3);
                var ramp = chroma.scale(cPlethStyle.scale).colors(categories.length).reverse();
                var columnName = _.find(layer.fields, function(field) {
                  return field.name == view.style.column.name;
                }).title[Lang.get()];
              }
            }
          }

          var html = '<div id="legend-' + view.id + '">';
          html += '<p class="item">';
          if(view.style.type == 'simple') {
            html += '<span class="' + clss + ' feat-ref" style="background:' + bgColor + ';border-color:' + strokeColor + ';border-width:' + stroke + ';"></span>';
            html += name;
          } else if(view.style.type == 'category') {
            html += '<span class="layer-title">' + name + '</span>';
            if(columnName)
              html += '<span class="column-title">' + columnName + '</span>';
            if(catStyle) {
              for(var name in catStyle) {
                html += '<span class="category-item clearfix">';
                html += '<span class="' + clss + ' feat-ref" style="background:rgba(' + chroma(catStyle[name]).rgb().join(',') + ', ' + style.fill.opacity + ');border-color:' + strokeColor + ';border-width:' + stroke + ';"></span>';
                html += name;
                html += '</span>';
              }
            }
          } else if(view.style.type == 'choropleth') {
            html += '<span class="layer-title">' + name + '</span>';
            if(columnName)
              html += '<span class="column-title">' + columnName + '</span>';
            html += '<span class="choropleth">';
            if(categories) {
              categories.forEach(function(cat, i) {
                if(cat % 1 !== 0) {
                  cat = cat.toFixed(2);
                }
                html += '<span class="choropleth-item" title="' + cat + '">';
                html += '<span class="choropleth-color" style="background-color:' + ramp[i] + ';"></span>';
                html += '<span class="choropleth-label">' + cat + '</span>';
                html += '</span>';
              });
            }
            html += '</span>';
          }
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
