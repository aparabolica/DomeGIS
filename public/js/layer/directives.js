angular.module('domegis')

.directive('derivedItem', [
  'Server',
  function(Server) {
    return {
      restrict: 'A',
      scope: {
        'layer': '=derivedItem',
      },
      templateUrl: '/views/layer/derived-item.html',
      link: function(scope, element, attrs) {

      }
    }
  }
])

.directive('layerItem', [
  'Server',
  function(Server) {
    return {
      restrict: 'A',
      scope: {
        'layer': '=layerItem'
      },
      templateUrl: '/views/layer/item.html',
      link: function(scope, element, attrs) {

        var layerService = Server.service('layers');
        var viewService = Server.service('views');

        scope.token = Server.app.get('token');

        Server.find(viewService, {
          query: {
            layerId: scope.layer.id
          }
        }).then(function(res) {
          scope.views = res.data;
        });
        scope.$on('server.layers.updated', function(ev, data) {
          if(scope.layer.id == data.id) {
            console.log('updated', data.id, data.sync.status);
            scope.layer = data;
          }
        });
        scope.$on('server.layers.patched', function(ev, data) {
          if(scope.layer.id == data.id) {
            console.log('patched', data.id, data.sync.status);
            scope.layer = data;
          }
        });
        scope.$on('server.views.created', function(ev, data) {
          if(data.layerId == scope.layer.id)
            scope.views.push(data);
        });
        scope.$on('server.views.removed', function(ev, data) {
          scope.views = _.filter(scope.views, function(item) {
            return item.id !== data.id;
          });
        });
        scope.resync = function() {
          console.log('resyncing');
          Server.patch(layerService, scope.layer.id, {
            resync: true
          }).then(function() {
            console.log('patched', arguments);
          }, function() {
            console.log('path err', arguments);
          });
        };

        scope.remove = function(layer) {
          Server.remove(layerService, layer.id);
        };
      }
    }
  }
]);
