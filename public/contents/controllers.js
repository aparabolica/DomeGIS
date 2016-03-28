angular.module('domegis')
.controller('QueryCtrl', [
  '$scope',
  'Content',
  'esriService',
  function($scope, Content, Esri) {

    $scope.content = Content.data;

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
        $scope.content = data.data;
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

    function getSortOrder(sort) {
      if(sort == 'title' || sort == 'owner') {
        return 'asc';
      } else {
        return 'desc';
      }
    }

  }
]);
