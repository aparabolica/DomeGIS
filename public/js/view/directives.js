angular.module('domegis')

.directive('viewItem', [
  'Server',
  function(Server) {
    return {
      restrict: 'A',
      scope: {
        'view': '=viewItem'
      },
      templateUrl: '/views/view/item.html',
      link: function(scope, element, attrs) {

        var viewService = Server.service('views');

        Server.on(viewService, 'updated', function(data) {
          if(data.id == scope.view.id)
            scope.view = data;
        });

        scope.token = Server.app.get('token');

        scope.remove = function(view) {
          if(confirm('Are you sure?')) {
            Server.remove(viewService, view.id);
          }
        };
      }
    }
  }
]);
