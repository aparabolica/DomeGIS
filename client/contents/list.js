angular.module('domegis')
.directive('contentList', function () {
  return {
    restrict: 'E',
    templateUrl: 'client/contents/list.html',
    controllerAs: 'contentList',
    controller: [
      '$scope',
      '$reactive',
      function($scope, $reactive) {

        $reactive(this).attach($scope);

        this.helpers({
          contents: () => {
            return Contents.find({});
          }
        });

        this.enableContent = (content) => {

          Contents.update({_id: content._id}, {
            $set: {
              active: true
            }
          }, (error) => {
            if (error) {
              console.log('Oops, unable to update the party...');
            }
            else {
              console.log('Done!');
            }
          });
        }
      }]
    }
})
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
          scope.src = arcgis.getApiRoot() + '/content/items/' + content.id + '/info/' + content.thumbnail;
        }, true);
      }
    }
  }
]);
