angular.module('domegis')

.directive('contentItem', [
  'Server',
  function(Server) {
    return {
      restrict: 'A',
      scope: {
        'content': '=contentItem'
      },
      templateUrl: '/views/content/item.html',
      link: function(scope, element, attrs) {

        var contentService = Server.service('contents');
        var layerService = Server.service('layers');

        scope.layers = [];

        if(scope.content) {
          Server.find(layerService, {
            query: {
              contentId: scope.content.id,
              $limit: 200
            }
          }).then(function(res) {
            scope.layers = res.data;
          });
        }

        scope.$on('server.layers.created', function(ev, data) {
          if(scope.content && data.contentId == scope.content.id && !_.find(scope.layers, function(l) { return l.id == data.id; }))
            scope.layers.push(data);
        });
        scope.$on('server.layers.removed', function(ev, data) {
          scope.layers = _.filter(scope.layers, function(item) {
            return item.id !== data.id;
          });
        });

        scope.unsyncItem = function(content) {
          if(Server.app.get('token'))
            Server.remove(contentService, content.id);
        };
      }
    }
  }
]);
