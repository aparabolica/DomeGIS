angular.module('domegis')
.controller('QueryCtrl', [
  '$scope',
  '$meteor',
  '$reactive',
  'Content',
  'esriService',
  function($scope, $meteor, $reactive, Content, Esri) {

    // DEPRECATED METHOD
    // $scope.synced = $meteor.collection(Contents);
    // $scope.syncContent = function(content) {
    //   $scope.synced.push(content);
    // };

    $reactive($scope).attach($scope);

    $scope.helpers({
      synced: () => Contents.find({})
    });

    // cnosole.log($scope.contents);
    console.log($scope);
    console.log(this);

    $scope.content = Content.data;

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
        $scope.content = data.data;
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

  }
]);
