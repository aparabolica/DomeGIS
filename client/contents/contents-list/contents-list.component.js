angular.module('domegis').directive('contentsList', function () {
  return {
    restrict: 'E',
    templateUrl: 'client/contents/contents-list/contents-list.html',
    controllerAs: 'contentsList',
    controller: function ($scope, $reactive) {
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
    }
  }
});
