angular.module('domegis')
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
      type: ''
    };
    $scope.params = {};

    $scope.sort = 'numviews';

    $scope.availableTypes = Esri.getContentTypes();

    $scope.doQuery = function() {
      $scope.doSort();
      Esri.getContent(
        $scope.search,
        $scope.query,
        $scope.params
      ).then(function(data) {
        $scope.content = data;
        console.log(data);
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
      var promise = Server.create(contentService, item);
      promise.then(function(res) {
        console.log('create', res);
      }, function(err) {
        console.log('create error', err);
      });
      return promise;
    };

    $scope.unsyncItem = function(item) {
      Server.remove(contentService, item.id).then(function(res) {
        console.log('remove', res);
      }, function(err) {
        console.log('remove error', err);
      });
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
        item.$viewLayers = true;
      }
    }

    Server.find(contentService).then(function(res) {
      console.log('synced contents', res);
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
  'Server',
  'Edit',
  function($scope, Server, Edit) {

    var viewService = Server.service('views');

    $scope.view = angular.copy(Edit);

    $scope.save = function(view) {
      if(Edit.id) {
        Server.update(viewService, Edit.id, view).then(function(view) {
          $scope.view = view;
        }, function(err) {
          console.log(err);
        });
      } else {
        Server.create(viewService, view).then(function(view) {
          $scope.view = view;
        }, function(err) {
          console.log(err);
        });
      }
    };

  }
]);
