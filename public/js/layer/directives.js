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

        scope.isOk = function(layer) {
          return layer.sync.status == 'finished' || layer.sync.status == 'imported' || layer.sync.status == 'ok';
        };
        scope.hasError = function(layer) {
          return layer.sync.status == 'failed' || layer.sync.status == 'error';
        };

        scope.hasRole = function(role) {
          var user = Server.app.get('user');
          if(user)
            return _.find(user.roles, function(r) { return r == role; });
          else
            return false;
        }

        Server.find(viewService, {
          query: {
            layerId: scope.layer.id,
            $limit: 100
          }
        }).then(function(res) {
          scope.views = res.data;
        });
        scope.$on('server.layers.updated', function(ev, data) {
          if(scope.layer.id == data.id) {
            scope.layer = data;
          }
        });
        scope.$on('server.layers.patched', function(ev, data) {
          if(scope.layer.id == data.id) {
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
          var doResync = true;

          if(scope.layer.sync && scope.layer.sync.status !== 'failed')
            doResync = confirm('Are you sure you\'d like to resync this layer data?');

          if(doResync == true) {
            Server.patch(layerService, scope.layer.id, {
              resync: true
            }).then(function() {
            }, function() {
              console.log('patch err', arguments);
            });
          }
        };

        scope.remove = function(layer) {
          Server.remove(layerService, layer.id);
        };
      }
    }
  }
]);
