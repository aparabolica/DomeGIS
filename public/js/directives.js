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
          if(content && content.data && content.data.thumbnail) {
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
  '$window',
  '$state',
  '$filter',
  'Server',
  'Lang',
  function($q, $http, $window, $state, $filter, Server, Lang) {
    return {
      restrict: 'A',
      scope: {
        views: '=domeMap',
        base: '=',
        feature: '=',
        preview: '=',
        scroll: '='
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

        var scrollWheelZoom = true;
        if(typeof scope.scroll == 'undefined') {
          scrollWheelZoom = self == top;
        } else {
          scrollWheelZoom = scope.scroll;
        }

        var map = L.map('map', {
          center: center,
          zoom: zoom,
          fullscreenControl: true,
          scrollWheelZoom: scrollWheelZoom
        });

        var downloadControl = L.control.downloadData();
        map.addControl(downloadControl);

        var legendControl = L.control.legend();
        map.addControl(legendControl);

        if(self == top) {
          map.on('move', _.debounce(function() {
            $state.go($state.current.name, {loc: getLocStr()}, {notify: false, replace: true});
          }, 400));
        }

        var baseLayers = L.layerGroup();

        baseLayers.addTo(map);

        scope.$watch('base', function() {

          var layers = [];

          baseLayers.clearLayers();

          if(scope.base == 'infoamazonia') {

            layers.push('http://{s}.tiles.mapbox.com/v3/infoamazonia.AndesAguaAmazonia_relevo_12AmzRaisg,infoamazonia.AndesAguaAmazonia_relevo_11AmzRaisg,infoamazonia.AndesAguaAmazonia_relevo1-10,infoamazonia.naturalEarth_baltimetria,infoamazonia.rivers,infoamazonia.AAA_pois,infoamazonia.osm-brasil/{z}/{x}/{y}.png');

          } else if(scope.base == 'osm') {

            layers.push('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

          } else {

            layers.push(L.tileLayer.bing({
              bingMapsKey: 'AqcPFocZWfHGkBoBjZ0e3NlBbKqN9t_lRuRyjVg7xHlc7JXWrGvupqLFYWRVqfv4',
              imagerySet: 'Aerial',
              zIndex: -1
            }));

          }

          layers.forEach(function(l) {
            if(typeof l == 'string') {
              baseLayers.addLayer(L.tileLayer(l, {zIndex: -1}));
            } else {
              l.addTo(map);
            }
          });

        });

        var layers = [];

        scope.$watch('views', updateLayers, true);

        scope.$on('updateLayers', function() {
          updateLayers(scope.views);
        });

        var mapBounds;

        var mapLayers = L.layerGroup();
        mapLayers.addTo(map);

        var featureBounds = false;
        var doneFeature = $q.defer();
        // get feature bounds
        if(
          scope.feature &&
          scope.feature.length &&
          scope.feature[0] &&
          scope.feature[1]
        ) {
          $http.get('/layers/' + scope.feature[0] + '/feature/' + scope.feature[1]).then(function(res) {
            featureBounds = res.data.extents;
            map.fitBounds(parseBounds(featureBounds));
            doneFeature.resolve();
          }, function(err) {
            doneFeature.resolve();
          });
        } else {
          doneFeature.resolve();
        }

        function updateLayers(views) {
          if(layers.length) {
            layers.forEach(function(layer) {
              if(layer.grid)
                mapLayers.removeLayer(layer.grid);
              mapLayers.removeLayer(layer.tile);
              legendControl.removeLegend(layer.legend);
              downloadControl.removeLayer(layer.layerId);
            });
            layers = [];
          }
          if(views && views.length) {
            var promises = [];
            views.forEach(function(view) {
              var id = view.id;
              if(scope.preview) {
                promises.push(Server.get(previewService, id));
              } else {
                promises.push(Server.get(viewService, id));
              }
            });
            $q.all(promises).then(function(data) {
              data.forEach(function(view) {
                view.hidden = _.find(views, function(v) {
                  return view.id == v.id;
                }).hidden;
              });
              doneFeature.promise.then(function() {
                var layerPromises = [];
                data.forEach(function(view) {
                  layerPromises.push(Server.get(layerService, view.layerId));
                })
                $q.all(layerPromises).then(function(layers) {
                  data.forEach(function(view) {
                    view.layer = _.find(layers, function(layer) {
                      return layer.id == view.layerId
                    });
                  });
                  if(!featureBounds) {
                    setViewsBounds(data);
                  }
                  data.forEach(addView);
                });
              });
            });
          }
        };

        function setViewsBounds(views) {
          if(!getStateLoc().length) {
            var mapBounds = L.latLngBounds();
            views.forEach(function(view) {
              if(view.layer.extents) {
                var bounds = parseBounds(view.layer.extents);
                if(mapBounds)
                  mapBounds.extend(bounds);
                else
                  mapBounds = bounds;
              }
            });
            map.fitBounds(mapBounds);
          }
        }

        function addView(view, i) {
          var layer = {};
          layer.layerId = view.layerId;
          layer.id = view.id;
          var tileBase = $window.domegis.tiles.urlTemplates.tile;
          var gridBase = $window.domegis.tiles.urlTemplates.grid;
          if(scope.preview) {
            tileBase += '?preview=true&time=' + Date.now();
            gridBase += '?preview=true&time=' + Date.now();
          }
          layer.tile = L.tileLayer(tileBase, {
            layergroupId: view.layergroupId,
            zIndex: (i+1)*10
          });
          if(!view.hidden)
            mapLayers.addLayer(layer.tile);
          if(view.fields && view.fields.length) {
            layer.grid = new L.UtfGrid(gridBase, {
              layergroupId: view.layergroupId,
              useJsonP: false
            });
            layer.grid.on('click', function(e) {
              if(e.data) {
                var popup = L.popup()
                  .setLatLng(e.latlng)
                  .setContent(getTooltipHtml(view, e.data, e.target._dm_fields))
                  .openOn(map);
              }
            });
            if(!view.hidden)
              mapLayers.addLayer(layer.grid);
          }
          layer.legend = getViewLegend(view, view.layer);
          if(layer.grid) {
            layer.grid._dm_fields = view.layer.fields;
          }
          legendControl.addLegend(layer.legend, [layer.tile, layer.grid]);
          downloadControl.addLayer({
            layerId: view.layer.id,
            title: $filter('translate')(view.layer.name),
            shp: '/downloads/' + view.layer.id + '.shp.zip',
            csv: '/downloads/' + view.layer.id + '.csv.zip'
          });
          layers.push(layer);
        };

        function getTooltipHtml(view, data, fields) {
          var html = '<div class="tooltip-content">';
          // console.log(view, data, fields);
          view.fields.forEach(function(field) {
            html += '<h2>' + getLabel(field, fields) + '</h2>';
            html += '<p>' + data[field] + '</p>';
          });
          // for(var key in data) {
          // }
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

          if(layer.type == 'raster')
            return '';

          var layerType;

          var name = $filter('translate')(layer.name);

          var style = _.find(view.style, function(style, type) {
            if(layer.geometryType) {
              var isStyle = layer.geometryType.toLowerCase().indexOf(type) !== -1;
              if(isStyle) {
                layerType = type;
                return true;
              } else {
                return false;
              }
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
