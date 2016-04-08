angular.module('domegis')
.controller('QueryCtrl', [
  '$scope',
  'Content',
  'Server',
  'esriService',
  function($scope, Content, Server, Esri) {

    $scope.content = Content;

    $scope.search = '';
    $scope.query = {
      type: ''
    };
    $scope.params = {};

    $scope.sort = 'numviews';

    $scope.availableTypes = Esri.getContentTypes();

    $scope.doQuery = () => {
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

    $scope.doSort = () => {
      $scope.params = _.extend($scope.params, {
        sortField: $scope.sort,
        sortOrder: getSortOrder($scope.sort)
      });
    };

    var contentService = Server.service('contents');

    Server.find(contentService).then(function(data) {
      console.log('find', data.data);
      $scope.synced = data.data;
    });

    Server.on(contentService, 'created', function(data) {
      $scope.synced.push(data);
    });
    Server.on(contentService, 'removed', function(data) {
      $scope.synced = _.filter($scope.synced, function(item) {
        return item.id !== data.id;
      });
    });

    $scope.syncItem = function(item) {
      Server.create(contentService, item).then(function(res) {
        console.log('create', res);
      }, function(err) {
        console.log('create error', err);
      });
    };

    $scope.unsyncItem = function(item) {
      Server.remove(contentService, item.id).then(function(res) {
        console.log('remove', res);
      }, function(err) {
        console.log('remove error', err);
      });
    };

    function getSortOrder(sort) {
      if(sort == 'title' || sort == 'owner') {
        return 'asc';
      } else {
        return 'desc';
      }
    }

    var viewService = Server.service('views');
    Server.on(viewService, 'created', function(data) {
      $scope.views.push(data);
    });
    Server.on(viewService, 'removed', function(data) {
      $scope.views = _.filter($scope.views, function(item) {
        return item.id !== data.id;
      });
    });


    Server.find(viewService).then(function(data) {
      $scope.views = data.data;
      console.log('views', $scope.views);
    });

    $scope.removeView = function(item) {
      Server.remove(viewService, item.id);
    };

  }
])

.controller('LayerEditCtrl', [
  '$scope',
  'Server',
  'Edit',
  function($scope, Server, Edit) {

    // var layerService = Server.service('layers');

    $scope.layer = Edit;

    $scope.save = function(layer) {
      // if(layer._id) {
      //   Server.update(layerService, layer._id, layer);
      // } else {
      //   Server.create(layerService, layer);
      // }
    };

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
