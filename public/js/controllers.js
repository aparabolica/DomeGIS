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

    $scope.syncItem = function() {
      Server.create(contentService, {
        text: "testing"
      }).then(function(res) {
        console.log(res);
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
]);
