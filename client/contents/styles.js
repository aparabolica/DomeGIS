var ace;

angular.module('domegis')

.directive('domegisStyles', [
  function() {
    return {
      restrict: 'E',
      templateUrl: 'client/contents/styles.html',
      scope: {
        content: '='
      },
      compile: function compile(element, attrs) {
        return {
          pre: function prelink(scope, element, attrs) {
            ace = AceEditor.instance();
          }
        }
      },
      controller: [
        '$scope',
        '$reactive',
        '$compile',
        function($scope, $reactive, $compile) {

          $scope.table = {
            title: 'table'
          };

          $scope.composites = {
            '': 'None',
            'multiply': 'Multiply',
            'screen': 'Screen',
            'overlay': 'Overlay',
            'darken': 'Darken',
            'lighten': 'Lighten',
            'color-dodge': 'Color dodge',
            'color-burn': 'Color burn'
          };

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

          $scope.styles = {
            polygon: {
              composite: '',
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
              composite: '',
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
            return val;
          }

          function regexEscape(str) {
            return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          }

          $scope.cartocss = '';

          var tableRegex = new RegExp(regexEscape('#' + $scope.table.title + ' {') + '([\\s\\S]*?)}');

          // Update styles object from raw CartoCSS
          $scope.$watch('cartocss', function(cartocss) {
            var tableMatch = cartocss.match(tableRegex);
            if(tableMatch != null && tableMatch[1]) {
              for(var type in mapCarto) {
                if($scope.isType(type)) {
                  for(var prop in mapCarto[type]) {
                    var propRegex = new RegExp(regexEscape(prop) + ':(.*?);');
                    var propMatch = cartocss.match(propRegex);
                    if(propMatch != null) {
                      eval('$scope.styles.' + type + '.' + mapCarto[type][prop] + ' = propMatch[1].trim().toLowerCase()');
                    }
                  }
                }
              }
            }
          });

          // Update CartoCSS output from styles object
          $scope.$watch('styles', function(styles, prevStyles) {

            var tableMatch = $scope.cartocss.match(tableRegex);

            var cartocss = '';

            if(tableMatch != null && tableMatch[1]) {
              cartocss = tableMatch[1];
            }

            for(var type in mapCarto) {
              if($scope.isType(type)) {
                for(var prop in mapCarto[type]) {
                  var propRegex = new RegExp('\t' + regexEscape(prop) + ':(.*?);\n');
                  var propMatch = cartocss.match(propRegex);
                  var val = getProp(type, prop);
                  if(propMatch != null) {
                    var rep = '';
                    if(val !== '')
                      rep = '\t' + prop + ': ' + val + ';\n';
                    if(propMatch[1].trim().toLowerCase() != val) {
                      cartocss = cartocss.replace(propRegex, rep);
                    }
                  } else {
                    if(val !== '')
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
        }
      ]
    }
  }
])

.directive('cartoEditor', [
  '$compile',
  function($compile) {
    return {
      restrict: 'EA',
      scope: {
        css: '=ngModel'
      },
      require: 'ngModel',
      template: '<div class="carto-editor"></div>',
      replace: true,
      link: function(scope, element, attrs, controller) {
        scope.aceOption = {
          mode: 'css',
          useWrapMode: false,
          showGutter: false,
          theme: 'github'
        };
        AceEditor.instance(element[0], null, function() {
          element.html($compile('<div ui-ace="aceOption" ng-model="css">{{css}}</div>')(scope));
        });
      }
    }
  }
])
