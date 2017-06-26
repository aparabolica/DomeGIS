var AuthDep = [
  '$q',
  'Server',
  function($q, Server) {
    var deferred = $q.defer();
    Server.auth().then(function() {
      deferred.resolve({
        token: Server.app.get('token'),
        user: Server.app.get('user')
      });
    }, function() {
      console.log(err);
      deferred.reject('not logged in');
    });
    return deferred.promise;
  }
];

angular.module('domegis')
.run([
  '$http',
  '$window',
  function($http, $window) {
    $http.get('/settings').then(function(res) {
      $window.domegis = res.data;
    });
  }
])
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
              '',
              {
                type: 'Feature Service',
              },
              {
                sortField: 'modified',
                sortOrder: 'desc'
              }
            );
          }
        ],
        Synced: [
          'Server',
          function(Server) {
            return Server.find(Server.service('contents'), {
              query: {
                $limit: 100
              }
            });
          }
        ],
        Derived: [
          'Server',
          function(Server) {
            return Server.find(Server.service('layers'), {
              query: {
                source: 'derived',
                $limit: 100
              }
            });
          }
        ],
        Uploaded: [
          'Server',
          function(Server) {
            return Server.find(Server.service('layers'), {
              query: {
                source: 'uploaded',
                $limit: 100
              }
            });
          }
        ]
      }
    })
    .state('library', {
      url: '/library/',
      controller: 'LibraryCtrl',
      templateUrl: '/views/library/index.html',
      resolve: {
        Layers: [
          'Server',
          function(Server) {
            return Server.find(Server.service('layers'), {
              query: {
                $limit: 100
              }
            });
          }
        ]
      }
    })
    .state('singleLayer', {
      url: '/library/:id/',
      controller: 'SingleLayerCtrl',
      templateUrl: '/views/layer/single.html',
      resolve: {
        Layer: [
          '$stateParams',
          'Server',
          function($stateParams, Server) {
            var id = $stateParams.id;
            if(id) {
              return Server.get(Server.service('layers'), id);
            } else {
              return false;
            }
          }
        ],
        Views: [
          'Layer',
          'Server',
          function(Layer, Server) {
            return Server.find(Server.service('views'), {
              query: {
                layerId: Layer.id,
                $limit: 100
              }
            });
          }
        ]
      }
    })
    .state('login', {
      url: '/login/',
      templateUrl: '/views/login.html'
    })
    .state('login.forgot', {
      url: 'forgot/',
      templateUrl: '/views/forgotPwd.html'
    })
    .state('users', {
      url: '/users/',
      templateUrl: '/views/user/index.html',
      controller: 'UserCtrl',
      resolve: {
        Auth: AuthDep,
        Users: [
          'Auth',
          'Server',
          function(Auth, Server) {
            return Server.find(Server.service('users'), {
              query: {
                $limit: 100
              }
            });
          }
        ]
      }
    })
    .state('usersEdit', {
      url: '/users/edit/?id',
      templateUrl: '/views/user/edit.html',
      controller: 'UserEditCtrl',
      resolve: {
        Auth: AuthDep,
        Edit: [
          'Auth',
          '$q',
          '$stateParams',
          'Server',
          function(Auth, $q, $stateParams, Server) {
            if($stateParams.id) {
              return Server.get(Server.service('users'), $stateParams.id);
            } else {
              return {};
            }
          }
        ]
      }
    })
    .state('upload', {
      url: '/upload/',
      controller: 'UploadCtrl',
      templateUrl: '/views/upload.html'
    })
    .state('derived', {
      url: '/derived/?sql',
      controller: 'DerivedCtrl',
      templateUrl: '/views/derived.html',
      resolve: {
        Layers: [
          'Server',
          function(Server) {
            return Server.find(Server.service('layers'), {
              query: {
                $limit: 100
              }
            });
          }
        ],
        Data: [
          '$q',
          '$http',
          '$stateParams',
          'MessageService',
          function($q, $http, $stateParams, Message) {
            var deferred = $q.defer();
            var data = [];
            if($stateParams.sql) {
              $http.get('/layers/preview', {
                params: {
                  sql: $stateParams.sql
                }
              }).then(function(res) {
                data = res.data[0];
                deferred.resolve(data);
              }, function(err) {
                Message.add(err.data.message);
                deferred.resolve(err.data);
              });
            } else {
              deferred.resolve(data);
            }
            return deferred.promise;
          }
        ]
      }
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
      url: '/views/edit/?id&layerId&loc&lang',
      params: {
        loc: {
          dynamic: true
        }
      },
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
        ],
        Distinct: [
          'Layer',
          '$http',
          function(layer, $http) {
            if(layer.type == 'raster')
              return [];
            else
              return $http.get('/layers/' + layer.id + '/values');
          }
        ]
      }
    })
    .state('editLayer', {
      url: '/layers/edit?id&contentId&lang',
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
    .state('generateMap', {
      url: '/map/?views&feature&base&scroll&loc&lang&full_legend',
      params: {
        loc: {
          dynamic: true
        }
      },
      templateUrl: '/views/map/single.html',
      controller: [
        '$scope',
        '$stateParams',
        function($scope, $stateParams) {
          $scope.views = [];
          if($stateParams.views) {
            var views = $stateParams.views.split(',');
            views.forEach(function(v) {
              var view = {};
              v = v.split(':');
              view.id = v[0];
              if(v[1] == 0) {
                view.hidden = true;
              } else {
                view.hidden = false;
              }
              $scope.views.push(view);
            });
          }
          $scope.scroll = $stateParams.scroll;
          if($stateParams.feature)
            $scope.feature = $stateParams.feature.split(':');
          $scope.base = $stateParams.base;
        }
      ]
    })
    .state('map', {
      url: '/maps/',
      templateUrl: '/views/map/index.html',
      controller: [
        '$scope',
        '$q',
        'Server',
        'Maps',
        function($scope, $q, Server, Maps) {
          var mapService = Server.service('maps');
          $scope.maps = Maps.data;
          $scope.maps.forEach(function(map) {
            var promises = [];
            map.layers.forEach(function(layer) {
              promises.push(Server.get(Server.service('layers'), layer.layerId));
            });
            $q.all(promises).then(function(layers) {
              map._layers = layers;
            });
          });
          $scope.remove = function(map) {
            if(confirm('Are you sure?')) {
              Server.remove(mapService, map.id);
            }
          };
          $scope.$on('server.maps.created', function(ev, data) {
            $scope.maps.unshift(data);
          });
          $scope.$on('server.maps.removed', function(ev, data) {
            $scope.maps = _.filter($scope.maps, function(item) {
              return item.id !== data.id;
            });
          });
          $scope.$on('server.maps.updated', function(ev, data) {
            $scope.maps.forEach(function(map, i) {
              if(map.id == data.id) {
                $scope.maps[i] = data;
              }
            });
          });
          $scope.$on('server.maps.patched', function(ev, data) {
            $scope.maps.forEach(function(map, i) {
              if(map.id == data.id) {
                $scope.maps[i] = data;
              }
            });
          });
        }
      ],
      resolve: {
        Auth: AuthDep,
        Maps: [
          'Server',
          function(Server) {
            return Server.find(Server.service('maps'), {
              query: {
                $limit: 100
              }
            });
          }
        ]
      }
    })
    .state('editMap', {
      url: '/maps/edit/?id',
      controller: 'MapEditCtrl',
      templateUrl: '/views/map/edit.html',
      resolve: {
        Analyses: [
          'Server',
          function(Server) {
            return Server.find(Server.service('analyses'), {
              query: {
                $limit: 100
              }
            });
          }
        ],
        Edit: [
          '$stateParams',
          'Server',
          function($stateParams, Server) {
            if($stateParams.id) {
              return Server.get(Server.service('maps'), $stateParams.id);
            } else {
              return {};
            }
          }
        ]
      }
    })
    .state('singleMap', {
      url: '/maps/:id/?loc&full_legend',
      params: {
        loc: {
          dynamic: true
        }
      },
      templateUrl: '/views/map/single.html',
      resolve: {
        MapData: [
          '$stateParams',
          'Server',
          function($stateParams, Server) {
            return Server.get(Server.service('maps'), $stateParams.id);
          }
        ]
      },
      controller: [
        '$stateParams',
        '$scope',
        'MapData',
        function($stateParams, $scope, MapData) {
          $scope.views = MapData.layers;
          $scope.scroll = MapData.scrollWheelZoom;
          $scope.widgets = MapData.widgets;
          $scope.base = MapData.baseLayer;
        }
      ]
    })
    .state('analysis', {
      url: '/analyses/',
      templateUrl: '/views/analysis/index.html',
      controller: 'AnalysisCtrl',
      resolve: {
        Analyses: [
          'Server',
          function(Server) {
            return Server.find(Server.service('analyses'), {
              query: {
                $limit: 100
              }
            });
          }
        ]
      }
    })
    .state('editAnalysis', {
      url: '/analyses/edit/?id',
      templateUrl: '/views/analysis/edit.html',
      controller: 'AnalysisEditCtrl',
      resolve: {
        Auth: AuthDep,
        Layers: [
          'Server',
          function(Server) {
            return Server.find(Server.service('layers'), {
              query: {
                $limit: 100
              }
            });
          }
        ],
        Edit: [
          'Auth',
          '$q',
          '$stateParams',
          'Server',
          function(Auth, $q, $stateParams, Server) {
            if($stateParams.id) {
              return Server.get(Server.service('analyses'), $stateParams.id);
            } else {
              return {};
            }
          }
        ]
      }
    })
    .state('singleAnalysis', {
      url: '/analyses/:id/',
      templateUrl: '/views/analysis/single.html',
      controller: 'AnalysisSingleCtrl',
      resolve: {
        Analysis: [
          'Server',
          '$stateParams',
          function(Server, $stateParams) {
            var id = $stateParams.id;
            return Server.get(Server.service('analyses'), id);
          }
        ]
      }
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
