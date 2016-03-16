angular.module('domegis')
.controller('QueryCtrl', [
  '$scope',
  'Content',
  'esriService',
  function($scope, Content, Esri) {

    $scope.helpers({
      synced: () => Contents.find({})
    });

    $scope.sort = {
      syncedAt: -1
    };

    $scope.subscribe('synced', () => {
      return [
        {
          sort: $scope.getReactively('sort')
        }
      ]
    });

    $scope.syncItem = (item) => {
      Meteor.call('syncContent', angular.copy(item));
    };

    $scope.unsyncItem = (item) => {
      Contents.remove({_id: item._id});
    };

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
