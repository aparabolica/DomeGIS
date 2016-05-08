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
  '$http',
  function($http) {
    return {
      restrict: 'A',
      scope: {
        viewId: '=domeMap'
      },
      replace: true,
      template: '<div id="map"></div>',
      link: function(scope, element, attrs) {

        var map = L.map('map', {
          center: [0,0],
          zoom: 2
        });

        map.addLayer(L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png'));

        var layers = [];

        scope.$watch('viewId', function(id) {
          layers.forEach(function(layer) {
            map.removeLayer(layer);
          });
          if(id) {
            var tileLayer = L.tileLayer('/tiles/' + id + '/{z}/{x}/{y}.png');
            layers = [];
            map.addLayer(tileLayer);
            layers.push(tileLayer);
          }
        });

      }
    }
  }
]);
