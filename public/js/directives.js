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
          scope.src = arcgis.getApiRoot() + '/content/items/' + (content.id || content._id) + '/info/' + (content.data ? content.data.thumbnail : content.thumbnail);
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
        url: '=domeMap',
        config: '=mapConfig'
      },
      replace: true,
      template: '<div id="map"></div>',
      link: function(scope, element, attrs) {
        var map = L.map('map', {
          center: [0,0],
          zoom: 2
        });

        var layers = [];

        scope.$watchGroup(['url', 'config'], function(val) {
          var url = val[0];
          var config = false;
          if(val[1]) {
            config = JSON.parse(val[1]);
          }

          if(url && config) {
            $http.post(url, config).then(function(res) {

              var token = res.data.layergroupid;
              var metadata = res.data.metadata;

              layers.forEach(function(layer) {
                map.removeLayer(layer);
              });
              layers = [];

              var baseUrl = url + '/' + token;
              var tileLayer = L.tileLayer(baseUrl + '/{z}/{x}/{y}.png');

              map.addLayer(tileLayer);
              layers.push(tileLayer);

              // handle metadata layer (utf grid) here
              //

            }, function(err) {
              console.log(err);
            });
          }

        }, true);

      }
    }
  }
]);
