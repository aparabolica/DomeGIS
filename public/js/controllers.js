angular.module('domegis')

.controller('SiteCtrl', [
  '$state',
  'Server',
  '$scope',
  function($state, Server, $scope) {

    Server.auth().then(function() {
      $scope.token = Server.app.get('token');
      $scope.user = Server.app.get('user');
    });

    $scope.auth = function(credentials) {
      Server.auth(_.extend({
        type: 'local'
      }, credentials)).then(function() {
        $scope.token = Server.app.get('token');
        $scope.user = Server.app.get('user');
      });
    };

    $scope.logout = function() {
      $scope.token = undefined;
      $scope.user = undefined;
      Server.app.logout();
    };

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
  '$state',
  'Server',
  function($scope, $state, Server) {
    var searchService = Server.service('search');
    var viewService = Server.service('views');

    $scope.search = '';
    $scope.results = [];

    $scope.$watch('search', function(search) {
      if(search) {
        searchService.find({
          query: {
            'term': search
          }
        }).then(function(res) {
          $scope.$apply(function() {
            if(res.layers && res.layers.length) {
              $scope.results = res.layers;
            } else {
              $scope.results = [];
            }
          });
        });
      } else {
        $scope.results = [];
      }
    });

    $scope.map = {};
    $scope._layers = [];

    $scope.addLayer = function(layer) {
      if(!$scope.map[layer.id]) {
        $scope.map[layer.id] = true;
        $scope._layers.push(layer);
        viewService.find({
          query: {
            layerId: layer.id
          }
        }).then(function(res) {
          $scope.$apply(function() {
            layer.views = res.data;
            $scope.map[layer.id] = res.data[0].id;
          });
        });
      }
    };

    $scope.removeLayer = function(layerId) {
      if($scope.map[layerId]) {
        delete $scope.map[layerId];
        $scope._layers = _.filter($scope._layers, function(l) {
          return l.id !== layerId;
        });
      }
    };

    $scope.getHTMLEmbed = function() {
      var url = $state.href('map', {views: getCSViews()}, {absolute: true});
      return '<iframe src="' + url + '" width="100%" height="400" frameborder="0"></iframe>';
    };

    $scope.getWPShortcode = function() {
      return '[domegis views="' + getCSViews() + '"]';
    };

    $scope.views = [];

    $scope.$watch('map', function() {
      $scope.views = [];
      $scope._layers.forEach(function(l) {
        if($scope.map[l.id] && $scope.map[l.id] != true)
          $scope.views.push($scope.map[l.id]);
      });
    }, true);
    $scope.$watch('_layers', function() {
      $scope.views = [];
      $scope._layers.forEach(function(l) {
        if($scope.map[l.id] && $scope.map[l.id] != true)
          $scope.views.push($scope.map[l.id]);
      });
    }, true);

    function getCSViews() {
      var views = [];
      $scope._layers.forEach(function(l) {
        if($scope.map[l.id] && $scope.map[l.id] != true)
          views.push($scope.map[l.id]);
      });
      return views.join(',');
    }
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
      return Server.create(contentService, item).then(function() {

      }, function(err) {
        console.log(err);
      });
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

    $scope.langs = [
      'en',
      'pt',
      'es'
    ];

    $scope.lang = $scope.langs[0];

    $scope.formLang = function(lang) {
      $scope.lang = lang;
    };

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

    // console.log(Layer);
    $scope.layer = Layer;

    $scope.view = angular.copy(Edit);

    $scope.toggleField = function(field) {
      var idx = $scope.view.fields.indexOf(field.name);
      // is currently selected
      if (idx > -1) {
        $scope.view.fields.splice(idx, 1);
      }
      // is newly selected
      else {
        $scope.view.fields.push(field.name);
      }
    };

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
