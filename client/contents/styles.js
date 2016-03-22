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

          $scope.table = {
            title: 'table'
          };

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
              composite: 'None',
              fill: {
                width: 10,
                opacity: 1
              },
              stroke: {
                width: .5,
                opacity: .8
              }
            }
          };

          $scope.$watch('styles', function(styles, prevStyles) {

            console.log(styles, prevStyles);

            if(styles != prevStyles || !$scope.cartocss) {

              var cartocss = '';

              cartocss += '#' + $scope.table.title + ' {\n';
              if($scope.isType('polygon')) {

                cartocss += '\tpolygon-fill: ' + ';\n';
                cartocss += '\tpolygon-opacity: ' + styles.polygon.fill.opacity + ';\n';
                if(styles.polygon.composite !== 'None') {
                  cartocss += '\tpolygon-comp-op: ' + styles.polygon.composite.toLowerCase().replace(' ', '-') + ';\n'
                }
                cartocss += '\tline-color: ' + ';\n';
                cartocss += '\tline-width: ' + styles.polygon.stroke.width + ';\n';
                cartocss += '\tline-opacity: ' + styles.polygon.stroke.opacity + ';\n';

              }

              if($scope.isType('polygon') && $scope.isType('point')) {
                cartocss + '\n\n';
              }

              if($scope.isType('point')) {

                cartocss += '\tmarker-width: ' + styles.marker.fill.width + ';\n';
                cartocss += '\tmarker-fill: ' + ';\n';
                cartocss += '\tmarker-fill-opacity: ' + styles.marker.fill.opacity + ';\n';
                if(styles.marker.composite !== 'None') {
                  cartocss += '\tmarker-comp-op: ' + styles.marker.composite.toLowerCase().replace(' ', '-') + ';\n'
                }
                cartocss += '\tmarker-line-color: ' + ';\n';
                cartocss += '\tmarker-line-width: ' + styles.marker.stroke.width + ';\n';
                cartocss += '\tmarker-line-opacity: ' + styles.marker.stroke.opacity + ';\n';


              }

              cartocss += '}';

              $scope.cartocss = cartocss;

            }

          }, true);

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
