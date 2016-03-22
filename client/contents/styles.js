angular.module('domegis')

.directive('domegisStyles', [
  function() {
    return {
      restrict: 'E',
      templateUrl: 'client/contents/styles.html',
      scope: {
        content: '='
      },
      controller: [
        '$scope',
        '$reactive',
        function($scope, $reactive) {

          $scope.styles = {
            polygon: {
              composite: 'None',
              fill: {
                opacity: .8,
              },
              stroke: {
                width: 1,
                opacity: .8
              }
            },
            marker: {
              fill: {
                opacity: 1
              },
              stroke: {
                width: .5,
                opacity: .8
              }
            }
          };

          $scope.composites = [
            'None',
            'Multiply',
            'Screen',
            'Overlay',
            'Darken',
            'Lighten',
            'Color dodge',
            'Color burn'
          ];

          $scope.types = ['polygon', 'point'];

          $scope.isType = function(type) {
            return $scope.types.indexOf(type) !== -1;
          };

          $scope.properties = [
            {
              key: 'amount',
              type: 'number',
              values: [1,2,3,4,5,6,7,8,9,10]
            },
            {
              key: 'category',
              type: 'string',
              values: ['category 1', 'category 2', 'category 3']
            }
          ];
        }
      ]
    }
  }
])
