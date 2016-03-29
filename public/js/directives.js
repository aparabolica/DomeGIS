angular.module('domegis')

.directive('contentThumbnail', [
  function() {
    return {
      restrict: 'E',
      scope: {
        content: '='
      },
      replace: true,
      template: '<img class="thumbnail" ng-src="{{src}}" />',
      link: function(scope, element, attrs) {
        scope.$watch('content', function(content) {
          scope.src = arcgis.getApiRoot() + '/content/items/' + (content.id || content._id) + '/info/' + (content.data ? content.data.thumbnail : content.thumbnail);
        }, true);
      }
    }
  }
]);
