(function(undefined) {

  module.exports = function(app) {

    app.directive('contentThumbnail', [
      'esriService',
      function(Esri) {
        return {
          restrict: 'E',
          scope: {
            content: '='
          },
          replace: true,
          template: '<img class="thumbnail" ng-src="{{src}}" />',
          link: function(scope, element, attrs) {
            scope.$watch('content', function(content) {
              scope.src = Esri.getApiRoot() + '/content/items/' + content.id + '/info/' + content.thumbnail;
            }, true);
          }
        }
      }
    ])

  }

})();
