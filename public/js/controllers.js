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
      console.log(data);
    });

    Server.on(contentService, 'created', function(data) {
      console.log('listened and created');
      console.log(data);
    });

    $scope.syncItem = function(item) {
      Server.create(contentService, {
        text: 'testing 2'
      }).then(function(res) {
        console.log(res);
      }, function(err) {
        console.log(err);
      });
    };

    function getSortOrder(sort) {
      if(sort == 'title' || sort == 'owner') {
        return 'asc';
      } else {
        return 'desc';
      }
    }

  }
])

.controller('LayerEditCtrl', [
  '$scope',
  'Edit',
  function($scope, Edit) {

    $scope.layer = Edit;

  }
])

.controller('ContentEditCtrl', [
  '$scope',
  'Edit',
  function($scope, Edit) {

    $scope.content = Edit;

  }
]);
