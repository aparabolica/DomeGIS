angular.module('domegis')
.config([
  '$stateProvider',
  '$urlRouterProvider',
  '$locationProvider',
  '$httpProvider',
  function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

    $locationProvider.html5Mode({
      enabled: false,
      requireBase: false
    });
    $locationProvider.hashPrefix('!');

    $stateProvider
    .state('home', {
      url: '/',
      controller: 'QueryCtrl',
      templateUrl: '/views/query.html',
      resolve: {
        Content: [
          'esriService',
          function(Esri) {
            return Esri.getContent(
              {
                type: 'Feature Service',
              },
              {
                sortField: 'modified',
                sortOrder: 'desc'
              }
            );
          }
        ]
      }
    })
    .state('login', {
      url: '/login/',
      controller: 'AuthCtrl',
      templateUrl: '/views/login.html'
    })
    .state('generateMap', {
      url: '/generate/',
      controller: 'GenerateCtrl',
      templateUrl: '/views/generate.html'
    })
    .state('editContent', {
      url: '/contents/edit/?id',
      templateUrl: '/views/content/edit.html',
      controller: 'ContentEditCtrl',
      resolve: {
        Edit: [
          '$stateParams',
          'Server',
          function($stateParams, Server) {
            if($stateParams.id) {
              return Server.get(Server.service('contents'), $stateParams.id);
            } else {
              return {};
            }
          }
        ]
      }
    })
    .state('editView', {
      url: '/views/edit/?id&layerId&loc',
      templateUrl: '/views/view/edit.html',
      controller: 'ViewEditCtrl',
      resolve: {
        Edit: [
          '$stateParams',
          'Server',
          function($stateParams, Server) {
            if($stateParams.id) {
              return Server.get(Server.service('views'), $stateParams.id);
            } else {
              if($stateParams.layerId) {
                return {
                  layerId: $stateParams.layerId
                }
              } else {
                return false;
              }
            }
          }
        ],
        Layer: [
          '$stateParams',
          'Server',
          'Edit',
          function($stateParams, Server, Edit) {
            var id = $stateParams.layerId || Edit.layerId;
            if(id) {
              return Server.get(Server.service('layers'), id);
            } else {
              return false;
            }
          }
        ]
      }
    })
    .state('editLayer', {
      url: '/layers/edit?id&contentId',
      templateUrl: '/views/layer/edit.html',
      controller: 'LayerEditCtrl',
      resolve: {
        Edit: [
          '$stateParams',
          'Server',
          function($stateParams, Server) {
            if($stateParams.id) {
              return Server.get(Server.service('layers'), $stateParams.id);
            } else {
              if($stateParams.contentId) {
                return {
                  contentId: $stateParams.contentId
                }
              } else {
                return false;
              }
            }
          }
        ]
      }
    })
    .state('map', {
      url: '/map/?views&base&loc',
      templateUrl: '/views/map.html',
      controller: [
        '$stateParams',
        '$scope',
        function($stateParams, $scope) {
          $scope.views = $stateParams.views.split(',');
          $scope.base = $stateParams.base;
        }
      ]
    });

    /*
     * Trailing slash rule
     */

    $urlRouterProvider.rule(function($injector, $location) {
      var path = $location.path(),
      search = $location.search(),
      params;

      // check to see if the path already ends in '/'
      if (path[path.length - 1] === '/') {
        return;
      }

      // If there was no search string / query params, return with a `/`
      if (Object.keys(search).length === 0) {
        return path + '/';
      }

      // Otherwise build the search string and return a `/?` prefix
      params = [];
      angular.forEach(search, function(v, k){
        params.push(k + '=' + v);
      });

      return path + '/?' + params.join('&');
    });

  }

]);
