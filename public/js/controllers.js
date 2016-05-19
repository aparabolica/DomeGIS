angular.module('domegis')

.controller('SiteCtrl', [
  '$state',
  '$scope',
  function($state, $scope) {

    $scope.bodyClass = [];

    $scope.$on('$stateChangeStart', function(ev, toState, toParams) {
      $scope.bodyClass = [];
      if(self != top) {
        $scope.bodyClass.push('iframe');
      }
      if(toState.name == 'map') {
        $scope.bodyClass.push('map');
      }
    });

    $scope.$on('$stateChangeSuccess', function(ev, toState, toParams) {
    });

  }
])

.controller('GenerateCtrl', [
  '$scope',
  'Server',
  function($scope, Server) {
    $scope.search = '';
    var searchService = Server.service('search');

    $scope.$watch('search', _.debounce(function(search) {
      if(search) {
        searchService.find({
          query: {
            'term': search
          }
        }).then(function(res) {
          if(res.layers && res.layers.length) {
            $scope.results = res.layers;
          } else {
            $scope.results = [];
          }
        });
      } else {
        $scope.results = [];
      }
    }, 200));

    $scope.map = {};
    $scope._layers = [];

    $scope.addLayer = function(layer) {
      if(!$scope.map[layer.id]) {
        $scope.map[layer.id] = true;
        $scope._layers.push(layer);
      }
    };
  }
])

.controller('AuthCtrl', [
  '$scope',
  function($scope) {

  }
])

.controller('QueryCtrl', [
  '$scope',
  'Content',
  'Server',
  'esriService',
  function($scope, Content, Server, Esri) {

    var contentService = Server.service('contents');

    $scope.content = Content;

    $scope.search = '';
    $scope.query = {
      type: 'Feature Service'
    };
    $scope.params = {};

    $scope.sort = 'modified';

    $scope.availableTypes = Esri.getContentTypes();

    $scope.doQuery = function() {
      $scope.doSort();
      Esri.getContent(
        $scope.search,
        $scope.query,
        $scope.params
      ).then(function(data) {
        $scope.content = data;
      });
    };

    $scope.$watchGroup(['search', 'query'], _.debounce(function() {
      $scope.doQuery();
    }, 500), true);

    $scope.doSort = function() {
      $scope.params = _.extend($scope.params, {
        sortField: $scope.sort,
        sortOrder: getSortOrder($scope.sort)
      });
    };

    function getSortOrder(sort) {
      if(sort == 'title' || sort == 'owner') {
        return 'asc';
      } else {
        return 'desc';
      }
    }

    $scope.syncItem = function(item) {
      return Server.create(contentService, item);
    };

    $scope.unsyncItem = function(item) {
      Server.remove(contentService, item.id);
    };


    $scope.toggleSync = function(item) {
      if(!$scope.isSynced(item)) {
        $scope.syncItem(item).then(function() {
          item.$viewLayers = true;
        });
      } else {
        if(confirm('Are you sure you\'d like to remove this content from collection?'))
          $scope.unsyncItem(item);
      }
    };

    $scope.toggleLayers = function(item) {
      if(item.$viewLayers) {
        item.$viewLayers = false;
      } else {
        if(!$scope.isSynced(item)) {
          if(confirm('Would you like to add this content to collection?')) {
            $scope.toggleSync(item);
          }
        } else {
          item.$viewLayers = true;
        }
      }
    }

    Server.find(contentService, {
      query: {
        $limit: 100
      }
    }).then(function(res) {
      $scope.synced = res.data;
    });
    Server.on(contentService, 'created', function(data) {
      $scope.synced.push(data);
    });
    Server.on(contentService, 'removed', function(data) {
      $scope.synced = _.filter($scope.synced, function(item) {
        return item.id !== data.id;
      });
    });

    $scope.isSynced = function(item) {
      return _.find($scope.synced, function(s) {
        return item.id == s.id;
      });
    };

  }
])

.controller('LayerEditCtrl', [
  '$scope',
  'Server',
  'Edit',
  function($scope, Server, Edit) {

    console.log(Edit);

    var layerService = Server.service('layers');

    $scope.layer = angular.copy(Edit);

    $scope.save = function(layer) {
      if(Edit.id) {
        Server.update(layerService, Edit.id, layer).then(function(layer) {
          $scope.layer = layer;
        }, function(err) {
          console.log(err);
        });
      } else {
        Server.create(layerService, layer).then(function(layer) {
          $scope.layer = layer;
        }, function(err) {
          console.log(err);
        });
      }
    };

  }
])

.controller('ArcGisCtrl', [
  '$scope',
  function($scope) {
    $scope.getArcGisUrl = function(content) {
      return 'http://' + arcgis.organization + '.maps.arcgis.com/home/item.html?id=' + content.id;
    }
  }
])

.controller('ContentEditCtrl', [
  '$scope',
  'Server',
  'Edit',
  function($scope, Server, Edit) {

    var contentService = Server.service('contents');

    $scope.content = angular.copy(Edit);

    $scope.save = function(content) {
      if(Edit.id) {
        Server.update(contentService, Edit.id, content);
      } else {
        Server.create(contentService, content);
      }
    };

  }
])

.controller('ViewEditCtrl', [
  '$scope',
  '$state',
  'Server',
  'Edit',
  'Layer',
  function($scope, $state, Server, Edit, Layer) {

    var viewService = Server.service('views');

    console.log(Layer);
    $scope.layer = Layer;

    $scope.view = angular.copy(Edit);

    $scope.$watch('view.style', _.debounce(function() {
      var preview = angular.copy(Edit);
      if(Edit.id) {
        Server.update(viewService, Edit.id, _.extend(preview, {
          previewCartoCss: $scope.view.cartocss
        })).then(function(data) {
          $scope.$broadcast('updateLayers');
        });
      }
    }, 300), true);

    $scope.save = function(view) {
      if(Edit.id) {
        Server.update(viewService, Edit.id, view).then(function(view) {
          $scope.view = view;
          $state.go('editView', {id: view.id}, {reload: true});
        }, function(err) {
          console.log(err);
        });
      } else {
        Server.create(viewService, view).then(function(view) {
          $scope.view = view;
          $state.go('editView', {id: view.id}, {reload: true});
        }, function(err) {
          console.log(err);
        });
      }
    };

  }
]);
