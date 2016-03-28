function regexEscape(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

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

angular.module('domegis')

.directive('domegisStyles', [
  function() {
    return {
      restrict: 'E',
      templateUrl: '/contents/styles/styles.html',
      scope: {
        content: '='
      },
      controller: [
        '$scope',
        '$compile',
        function($scope, $compile) {

          $scope.table = {
            title: 'table'
          };

          $scope.mapType = 'simple';

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

          var getProp = function(type, name) {
            var val = '';
            var name = eval('mapCarto.' + type)[name];
            if(name) {
              val = eval('$scope.styles.' + type + '.' + name);
            }
            return val;
          }

          $scope.cartocss = '';

          var tableRegex = new RegExp(regexEscape('#' + $scope.table.title + ' {') + '([\\s\\S]*?)}');

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
            } else if(!$scope.cartocss) {
              $scope.cartocss = '#' + $scope.table.title + ' {\n' + cartocss + '}\n\n';
            } else {
              $scope.cartocss = '#' + $scope.table.title + ' {\n' + cartocss + '}\n\n' + $scope.cartocss;
            }

          }, true);

          $scope.setMapType = function(type) {
            $scope.mapType = type;
          };

          $scope.columns = [
            {
              key: 'amount',
              type: 'number',
              values: [1,2,3,4,5,6,7,8,9,10,500,200,150,1000,300,250,123]
            },
            {
              key: 'category',
              type: 'string',
              values: ['category 1', 'category 2', 'category 3']
            },
            {
              key: 'something_else',
              type: 'string',
              values: ['something 1', 'something 2']
            }
          ];

          var clearCategories = function(columnKey, categories) {
            if(columnKey && _.isArray(categories)) {
              categories.forEach(function(category) {
                var catRegex = new RegExp(regexEscape('#' + $scope.table.title + ' [ ' + columnKey + ' = "' + category + '" ] {\n') + '([\\s\\S]*?)}\n\n');
                var catMatch = $scope.cartocss.match(catRegex);
                if(catMatch != null && (catMatch[1] || catMatch[1] == '')) {
                  $scope.cartocss = $scope.cartocss.replace(catRegex, '');
                }
              });
            }
          };

          var updateCategories = function(styles) {

            if($scope.column && styles) {
              if(styles[$scope.column.key]) {
                styles = styles[$scope.column.key];
              } else {
                styles = false;
              }
            }

            if(styles && $scope.mapType == 'category' && $scope.column) {

              for(var category in styles) {

                var cartocss = '';

                var catRegex = new RegExp(regexEscape('#' + $scope.table.title + ' [ ' + $scope.column.key + ' = "' + category + '" ] {\n') + '([\\s\\S]*?)}');

                var catMatch = $scope.cartocss.match(catRegex);

                if(catMatch != null && (catMatch[1] || catMatch[1] == '')) {
                  cartocss = catMatch[1];
                }

                var propRegex = new RegExp('\t' + 'polygon-fill' + ':(.*?);\n');

                var propMatch = cartocss.match(propRegex);

                var val = styles[category];

                if(propMatch != null) {
                  var rep = '';
                  if(val !== '')
                    rep = '\t' + 'polygon-fill' + ': ' + val + ';\n';
                  if(propMatch[1].trim().toLowerCase() != val) {
                    cartocss = cartocss.replace(propRegex, rep);
                  }
                } else {
                  if(val !== '')
                    cartocss += '\t' + 'polygon-fill' + ': ' + val + ';\n';
                }

                var result = '#' + $scope.table.title + ' [ ' + $scope.column.key + ' = "' + category + '" ] {\n' + cartocss + '}';

                if(catMatch != null && (catMatch[1] || catMatch[1] == '')) {
                  $scope.cartocss = $scope.cartocss.replace(catRegex, result);
                } else if(!$scope.cartocss) {
                  $scope.cartocss = result + '\n\n';
                } else {
                  $scope.cartocss += result + '\n\n';
                }

              }
            }

          };

          $scope.selectColumn = function(columnKey, prevColumnKey) {

            if(prevColumnKey)
              clearCategories(prevColumnKey, $scope.categories);

            if(!$scope.column) {
              $scope.categories = [];
            } else {
              if($scope.column.type == 'number') {
                $scope.categories = quantiles($scope.column.values, 3);
              } else {
                $scope.categories = $scope.column.values;
              }
            }

            if($scope.mapType == 'category') {
              updateCategories($scope.styles.category);
            }

          };

          $scope.$watch('styles.category', updateCategories, true);
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
        cartoEditor: '=',
        group: '=',
        css: '=ngModel',
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

        element.html($compile('<div ui-ace="aceOption" ng-model="css">{{css}}</div>')(scope));

        var tableRegex = '';

        scope.$watch('group', function(g) {
          tableRegex = new RegExp(regexEscape('#' + g + ' {') + '([\\s\\S]*?)}');
        });

        // Update styles object from raw CartoCSS
        scope.$watch('css', function(cartocss) {
          if(cartocss) {
            var tableMatch = cartocss.match(tableRegex);
            if(tableMatch != null && tableMatch[1]) {
              for(var type in mapCarto) {
                for(var prop in mapCarto[type]) {
                  var propRegex = new RegExp('[ \t]' + regexEscape(prop) + ':(.*?);');
                  var propMatch = cartocss.match(propRegex);
                  if(propMatch != null) {
                    eval('scope.cartoEditor.' + type + '.' + mapCarto[type][prop] + ' = propMatch[1].trim().toLowerCase()');
                  } else {
                    eval('scope.cartoEditor.' + type + '.' + mapCarto[type][prop] + ' = "";');
                  }
                }
              }
            }
          }
        });
      }
    }
  }
])

.filter('mapType', [
  function() {
    return function(input, type) {
      if(_.isArray(input)) {
        if(type == 'category') {
          input = _.filter(input, function(column) {
            return column.type == 'string';
          });
        } else if(type == 'choropleth') {
          input = _.filter(input, function(column) {
            return column.type == 'number';
          });
        }
      }
      return input;
    }
  }
])
