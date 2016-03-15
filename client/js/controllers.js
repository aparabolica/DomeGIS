'use strict';

angular.module('domegis')

.controller('MainCtrl', [
  '$scope',
  function($scope) {

  }
])

.controller('QueryCtrl', [
  '$scope',
  'Content',
  'esriService',
  function($scope, Content, Esri) {
    $scope.content = Content.data;


    $scope.search = '';
    $scope.params = {
      type: ''
    };
    $scope.sort = 'numviews';

    $scope.query = {};

    $scope.availableTypes = Esri.getContentTypes();

    $scope.doQuery = function() {

      $scope.doSort();

      Esri.getContent(
        $scope.search,
        $scope.params,
        $scope.query
      ).then(function(data) {
        $scope.content = data.data;
      });
    };

    $scope.$watchGroup(['search', 'params'], _.debounce(function() {
      $scope.doQuery();
    }, 500), true);

    $scope.doSort = function() {
      $scope.query = _.extend($scope.query, {
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
