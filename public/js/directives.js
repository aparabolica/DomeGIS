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
  function($q, $state, Server) {
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

        function updateLayers(views) {
          layers.forEach(function(layer) {
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
          if(scope.preview) {
            url += '?preview=true&time=' + Date.now();
          }
          layer.tile = L.tileLayer(url);
          map.addLayer(layer.tile);
          layers.push(layer);
          Server.get(layerService, view.layerId).then(function(l) {
            layer.legend = getViewLegend(view, l);
            legendControl.addLegend(layer.legend);
          });
        }

        function getViewLegend(view, layer) {

          var style = _.find(view.style, function(style, type) {
            return layer.geometryType.toLowerCase().indexOf(type) !== -1;
          });

          var bgColor = style.fill.color;
          var bgOpacity = style.fill.opacity;
          var stroke = style.stroke.width;
          var strokeColor = style.stroke.color;

          var html = '<div id="legend-' + view.id + '">';
          html += '<p class="item">';
          html += '<span class="sqr" style="background:' + bgColor + ';opacity:' + bgOpacity + ';border-color:' + strokeColor + ';border-width:' + stroke + 'px;"></span>';
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
