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

        scope.$on('server.views.updated', function(ev, data) {
          if(data.id == scope.view.id)
            scope.view = data;
        });
        scope.$on('server.views.patched', function(ev, data) {
          if(data.id == scope.view.id)
            scope.view = data;
        });

        scope.user = Server.app.get('user');

        scope.canCreate = function(view) {
          if(scope.user) {
            return scope.user.roles.indexOf('editor') != -1;
          } else {
            return false;
          }
        };

        scope.canEdit = function(view) {
          if(scope.user) {
            return scope.user.roles.indexOf('editor') != -1 || scope.user.id == view.creatorId;
          } else {
            return false;
          }
        };

        scope.remove = function(view) {
          if(confirm('Are you sure?')) {
            Server.remove(viewService, view.id);
          }
        };
      }
    }
  }
]);
