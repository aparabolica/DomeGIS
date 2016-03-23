var ace = AceEditor.instance();

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
        '$compile',
        function($scope, $reactive, $compile) {

          $scope.aceOption = {
            mode: 'css',
            useWrapMode: false,
            showGutter: false,
            theme: 'github'
          };

          $scope.table = {
            title: 'table'
          };

          $scope.styles = {
            polygon: {
              composite: 'None',
              fill: {
                color: '#f00',
                opacity: .8,
              },
              stroke: {
                color: '#0f0',
                width: 1,
                opacity: .8
              }
            },
            marker: {
              composite: 'None',
              fill: {
                width: 10,
                color: '#00f',
                opacity: 1
              },
              stroke: {
                color: '#0f0',
                width: .5,
                opacity: .8
              }
            }
          };

          var mapCarto = {
            'polygon': {
              'polygon-fill': 'fill.color',
              'polygon-opacity': 'fill.opacity',
              'polygon-comp-op': 'composite',
              'line-color': 'stroke.color',
              'line-width': 'stroke.width',
              'line-opacity': 'stroke.opacity'
            },
            'marker': {
              'marker-width': 'fill.width',
              'marker-fill': 'fill.color',
              'marker-fill-opacity': 'fill.opacity',
              'marker-comp-op': 'composite',
              'marker-line-color': 'stroke.color',
              'marker-line-width': 'stroke.width',
              'marker-line-opacity': 'stroke.opacity'
            }
          };

          var getProp = function(type, name) {
            var val = '';
            if(mapCarto[type][name]) {
              return eval('$scope.styles.' + type + '.' + mapCarto[type][name]);
            }
            $scope.$broadcast('cartocss.get.prop', name, val);
            return val;
          }

          $scope.$on('cartocss.get.prop', function(ev, name, val) {
            if(name.indexOf('comp-op') !== -1 && val) {
              val = val.toLowerCase().replace(' ', '-');
              if(val == 'none') {
                val = '';
              }
            }
          });

          function regexEscape(str) {
            return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          }

          $scope.cartocss = '';

          var tableRegex = new RegExp(regexEscape('#' + $scope.table.title + ' {') + '([\\s\\S]*?)}');

          $scope.$watch('styles', function(styles, prevStyles) {

            var tableMatch = $scope.cartocss.match(tableRegex);

            var cartocss = '';

            if(tableMatch != null && tableMatch[1]) {
              cartocss = tableMatch[1];
            }

            for(var type in mapCarto) {
              if($scope.isType(type)) {
                for(var prop in mapCarto[type]) {
                  var propRegex = new RegExp(regexEscape(prop) + ':(.*?);');
                  var propMatch = cartocss.match(propRegex);
                  var val = getProp(type, prop);
                  if(propMatch != null) {
                    cartocss = cartocss.replace(propRegex, '' + prop + ': ' + val + ';');
                  } else {
                    cartocss += '\t' + prop + ': ' + val + ';\n';
                  }
                }
              }
            }

            if(tableMatch != null && tableMatch[1]) {
              $scope.cartocss = $scope.cartocss.replace(tableRegex, '#' + $scope.table.title + ' {' + cartocss + '}');
            } else {
              $scope.cartocss = '#' + $scope.table.title + ' {\n' + cartocss + '}';
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

          $scope.types = ['polygon', 'marker'];

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
