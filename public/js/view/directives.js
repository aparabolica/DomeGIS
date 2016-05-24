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
        
        scope.token = Server.app.get('token');

        scope.remove = function(view) {
          Server.remove(viewService, view.id);
        };
      }
    }
  }
]);
