var demo = {
  contents: [
    {
      id: 1,
      title: 'Test'
    }
  ],
  layers: [
    {
      id: 1,
      title: 'Test'
    }
  ]
};

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
            return Esri.getContent();
          }
        ]
      }
    })
    .state('login', {
      url: '/login/',
      controller: 'AuthCtrl',
      templateUrl: '/views/login.html'
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
      url: '/views/edit/?id&layerId',
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
        ]
      }
    })
    .state('layers', {
      url: '/layers/',
      controller: 'LayerCtrl',
      resolve: {
        Contents: [
          function() {
            return demo.layers
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
      url: '/map/',
      templateUrl: '/views/map.html',
      controller: [
        '$scope',
        function($scope) {
          $scope.url = '/tiles';
          $scope.config = JSON.stringify({
            "version": "1.2.0",
            "layers": [
              {
                "type": "mapnik",
                "options": {
                  "sql": "select * from domegis",
                  "geom_column": "the_geom",
                  "cartocss": "#style{ polygon-fill: blue; line-color: red;}",
                  "cartocss_version": "2.0.0",
                  "interactivity": "subprefeit"
                }
              }
            ]
          }, null, 2);
        }
      ]
    })
    .state('styles', {
      url: '/styles/',
      template: '<domegis-styles></domegis-styles>'
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
