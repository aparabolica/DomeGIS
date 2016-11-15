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
  'point': {
    'marker-width': 'fill.width',
    'marker-fill': 'fill.color',
    'marker-fill-opacity': 'fill.opacity',
    'marker-comp-op': 'composite',
    'marker-allow-overlap': 'allowOverlap',
    'marker-line-color': 'stroke.color',
    'marker-line-width': 'stroke.width',
    'marker-line-opacity': 'stroke.opacity',
    'marker-type': 'type'
  },
  'linestring': {
    'line-color': 'fill.color',
    'line-width': 'fill.width',
    'line-opacity': 'fill.opacity',
    'line-comp-op': 'composite'
  },
  'raster': {
    'raster-opacity': 'opacity',
    'raster-filter-factor': 'filterFactor',
    'raster-scaling': 'scaling',
    'raster-mesh-size': 'meshSize',
    'raster-colorizer-default-mode': 'colorizerMode',
    'raster-colorizer-default-color': 'colorizerColor',
    'raster-colorizer-stops': 'colorizerStops',
    'raster-comp-op': 'composite'
  }
};

angular.module('domegis')

.directive('domegisStyles', [
  '$filter',
  function($filter) {
    return {
      restrict: 'E',
      templateUrl: '/views/styles.html',
      scope: {
        layer: '=',
        styles: '=ngModel',
        columns: '=',
        cartocss: '='
      },
      require: 'ngModel',
      controller: [
        '$scope',
        '$compile',
        function($scope, $compile) {

          console.log($scope.layer);

          if($scope.layer) {
            if($scope.layer.geometryType)
              $scope.types = $scope.layer.geometryType.toLowerCase();
            else if($scope.layer.type == 'raster')
              $scope.types = 'raster';
          }

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

          $scope.scaling = [
            'near',
            'fast',
            'bilinear',
            'bicubic',
            'spline16',
            'spline36',
            'hanning',
            'hamming',
            'hermite',
            'kaiser',
            'quadric',
            'catrom',
            'gaussian',
            'bessel',
            'mitchell',
            'sinc',
            'lanczos',
            'blackman'
          ];

          $scope.colorizerMode = [
            'discrete',
            'linear',
            'exact'
          ];

          $scope.getContrastYIQ = function(hexcolor, rgba){
            if(rgba == true) {
              hexcolor = hexcolor.replace('rgba(', '').replace(')', '');
              var rgba = hexcolor.split(',');
              var r = parseInt(rgba[0].trim());
              var g = parseInt(rgba[1].trim());
              var b = parseInt(rgba[2].trim());
              var alpha = parseFloat(rgba[3].trim());
              if(alpha <= .5) {
                return 'black';
              }
            } else {
              hexcolor = hexcolor.replace('#', '');
              var r = parseInt(hexcolor.substr(0,2),16);
              var g = parseInt(hexcolor.substr(2,2),16);
              var b = parseInt(hexcolor.substr(4,2),16);
            }
            var yiq = ((r*299)+(g*587)+(b*114))/1000;
            return (yiq >= 128) ? 'black' : 'white';
          }

          $scope.isType = function(type) {
            if($scope.types)
              return $scope.types.indexOf(type) !== -1;
            else
              return false;
          };

          $scope.cartocss = $scope.cartocss || '';

          var defaultStyles = {
            type: 'simple',
            column: '',
            polygon: {
              composite: '',
              fill: {
                color: '#61c7e2',
                opacity: .8,
              },
              stroke: {
                color: '#000000',
                width: 1,
                opacity: .8
              }
            },
            point: {
              composite: '',
              type: 'ellipse',
              allowOverlap: true,
              fill: {
                width: 10,
                color: '#ff8a00',
                opacity: 1
              },
              stroke: {
                color: '#000000',
                width: .5,
                opacity: .8
              }
            },
            linestring: {
              composite: '',
              fill: {
                width: 1.5,
                color: '#70ff00',
                opacity: .8
              }
            },
            raster: {
              band: 1,
              opacity: 1,
              filterFactor: -1,
              scaling: 'near',
              meshSize: 16,
              colorizerMode: 'linear',
              colorizerColor: 'rgba(0,0,0,0)',
              colorizerStops: 'stop(0, rgba(237,28,28,1)) stop(30, rgba(209,20,190,1))',
              composite: ''
            }
          };

          if($scope.layer && $scope.layer.metadata) {
            if($scope.layer.metadata.bands) {
              if($scope.layer.metadata.bands.length && $scope.layer.metadata.bands.length == 1) {
                defaultStyles.raster.band = 0;
              }
            }
          }

          console.log($scope.styles);

          $scope.styles = $scope.styles || defaultStyles;

          var getProp = function(type, name) {
            var val = '';
            var name = eval('mapCarto.' + type)[name];
            if(name) {
              val = eval('$scope.styles.' + type + '.' + name);
            }
            return val;
          }

          var tableRegex = new RegExp(regexEscape('#' + $scope.table.title + ' {') + '([\\s\\S]*?)}');

          // Update CartoCSS output from styles object
          $scope.$watch('styles', function(styles, prevStyles) {

            if(styles) {

              var tableMatch = $scope.cartocss ? $scope.cartocss.match(tableRegex) : null;

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

            }

          }, true);

          $scope.setMapType = function(type) {
            // Clear previous map type css
            if($scope.styles.column) {
              if($scope.styles.type == 'choropleth') {
                clearChoropleth($scope.styles.column.name);
              } else if($scope.styles.type == 'category') {
                clearCategories($scope.styles.column.name, $scope.categories);
              }
            }
            // Set new type
            $scope.styles.type = type;
            if(!$scope.styles[type])
              $scope.styles[type] = {};
          };


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

          var clearChoropleth = function(columnKey) {

            var regex = new RegExp(regexEscape('#' + $scope.table.title + ' [ ' + columnKey + ' <=') + '([\\s\\S]*?)}\n\n', 'g');

            $scope.cartocss = $scope.cartocss.replace(regex, '');

          };

          var updateCategories = function(styles) {

            if($scope.styles.column && styles) {
              if(styles[$scope.styles.column.name]) {
                styles = styles[$scope.styles.column.name];
              } else {
                styles = false;
              }
            }

            if(styles && $scope.styles.column) {

              for(var category in styles) {

                var cartocss = '';

                var catRegex = new RegExp(regexEscape('#' + $scope.table.title + ' [ ' + $scope.styles.column.name + ' = "' + category + '" ] {\n') + '([\\s\\S]*?)}');

                var catMatch = $scope.cartocss.match(catRegex);

                if(catMatch != null && (catMatch[1] || catMatch[1] == '')) {
                  cartocss = catMatch[1];
                }

                var propRegex;

                if($scope.isType('polygon'))
                  propRegex = new RegExp('\t' + 'polygon-fill' + ':(.*?);\n');
                else if($scope.isType('point'))
                  propRegex = new RegExp('\t' + 'marker-fill' + ':(.*?);\n');
                else if($scope.isType('linestring'))
                  propRegex = new RegExp('\t' + 'line-color' + ':(.*?);\n');

                var propMatch = cartocss.match(propRegex);

                var val = styles[category];

                if(propMatch != null) {
                  var rep = '';
                  if(val !== '')
                    if($scope.isType('polygon'))
                      rep = '\t' + 'polygon-fill' + ': ' + val + ';\n';
                    else if ($scope.isType('point'))
                      rep = '\t' + 'marker-fill' + ': ' + val + ';\n';
                    else if ($scope.isType('linestring'))
                      rep = '\t' + 'line-color' + ': ' + val + ';\n';
                  if(propMatch[1].trim().toLowerCase() != val) {
                    cartocss = cartocss.replace(propRegex, rep);
                  }
                } else {
                  if(val !== '')
                    if($scope.isType('polygon'))
                      cartocss += '\t' + 'polygon-fill' + ': ' + val + ';\n';
                    else if ($scope.isType('point'))
                      cartocss += '\t' + 'marker-fill' + ': ' + val + ';\n';
                    else if ($scope.isType('linestring'))
                      cartocss += '\t' + 'line-color' + ': ' + val + ';\n';
                }

                var result = '#' + $scope.table.title + ' [ ' + $scope.styles.column.name + ' = "' + category + '" ] {\n' + cartocss + '}';

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

          var updateChoropleth = function(styles) {

            if($scope.styles.column && styles) {
              if(styles[$scope.styles.column.name]) {
                styles = styles[$scope.styles.column.name];
              } else {
                styles = false;
              }
            }

            if(styles && $scope.styles.column) {

              clearChoropleth($scope.styles.column.name);

              var size = styles.bucket_size || 5;
              var categories = quantiles($scope.styles.column.values, size);

              if(!_.isArray(styles.scale)) {
                styles.scale = ['#000000', '#FFFFFF'];
              }
              var ramp = chroma.scale(styles.scale).colors(categories.length);

              categories = _.sortBy(categories, function(cat) { return -cat; });

              categories.forEach(function(category, i) {

                var cartocss = '';

                var catRegex = new RegExp(regexEscape('#' + $scope.table.title + ' [ ' + $scope.styles.column.name + ' <= ' + category + ' ] {\n') + '([\\s\\S]*?)}');

                var catMatch = $scope.cartocss.match(catRegex);

                if($scope.isType('polygon')) {
                  cartocss += '\t' + 'polygon-fill' + ': ' + ramp[i] + ';\n';
                }
                if($scope.isType('point')) {
                  cartocss += '\t' + 'marker-fill' + ': ' + ramp[i] + ';\n';
                }
                if($scope.isType('linestring')) {
                  cartocss += '\t' + 'line-color' + ': ' + ramp[i] + ';\n';
                }

                var result = '#' + $scope.table.title + ' [ ' + $scope.styles.column.name + ' <= ' + category + ' ] {\n' + cartocss + '}';

                if(catMatch != null && (catMatch[1] || catMatch[1] == '')) {
                  $scope.cartocss = $scope.cartocss.replace(catRegex, result);
                } else if(!$scope.cartocss) {
                  $scope.cartocss = result + '\n\n';
                } else {
                  $scope.cartocss += result + '\n\n';
                }

              });

            }

          };

          $scope.selectColumn = function(columnKey, prevColumnKey) {

            if(prevColumnKey) {
              clearCategories(prevColumnKey, $scope.categories);
              clearChoropleth(prevColumnKey);
            }

            if(!$scope.styles.column) {

              $scope.categories = [];

            } else {

              if($scope.styles.column.type == 'esriFieldTypeInteger' || $scope.styles.column.type == 'esriFieldTypeDouble') {

                if(!$scope.styles.choropleth[$scope.styles.column.name]) {
                  $scope.styles.choropleth[$scope.styles.column.name] = {
                    bucket_size: 5,
                    scale: ['#000000', '#ffffff']
                  };
                }

              } else {

                $scope.categories = $scope.styles.column.values;

                if(!$scope.styles.category[$scope.styles.column.name])
                  $scope.styles.category[$scope.styles.column.name] = {};

                var catColumn = $scope.styles.category[$scope.styles.column.name];
                $scope.categories.forEach(function(category) {
                  if(!catColumn)
                    catColumn = {};
                  if(!catColumn[category]) {
                    catColumn[category] = chroma.random().hex();
                  }
                });

              }
            }

            if($scope.styles.type == 'category') {
              updateCategories($scope.styles.category);
            }

            if($scope.styles.type == 'choropleth') {
              updateChoropleth($scope.styles.choropleth);
            }

          };

          $scope.$watch('styles.category', function(styles) {
            if($scope.styles.type == 'category') {
              updateCategories(styles);
            }
          }, true);

          $scope.$watch('styles.choropleth', function(styles) {
            if($scope.styles.type == 'choropleth') {
              updateChoropleth(styles);
            }
          }, true);

          if($scope.styles.column) {
            $scope.selectColumn($scope.styles.column.name);
          }

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

        var aceLoaded = function(editor) {
          scope.$watch('css', function() {
            // after data update
            // var cell = $("div.ace_gutter-layer").find(".ace_gutter-cell:first");
            // var h = cell.height();
            // var totalH = h * (editor.getSession().getValue().split('\n').length + 1);
            // $('.carto-editor')
            //   .height(totalH);
            // $('.carto-editor')
            //   .find(":first-child")
            //   .height($('.carto-editor').height());
            // editor.renderer.onResize(true);
          });
        };

        scope.aceOption = {
          mode: 'css',
          useWrapMode: false,
          showGutter: false,
          theme: 'github',
          maxLines: Infinity,
          onLoad: aceLoaded
        };

        element.html($compile('<div ui-ace="aceOption" ng-model="css">{{css}}</div>')(scope));

        var tableRegex = '';

        // scope.$watch('group', function(g) {
        //   tableRegex = new RegExp(regexEscape('#' + g + ' {') + '([\\s\\S]*?)}');
        // });

        // Update styles object from raw CartoCSS
        // scope.$watch('css', function(cartocss) {
        //   if(cartocss) {
        //     var tableMatch = cartocss.match(tableRegex);
        //     if(tableMatch != null && tableMatch[1]) {
        //       for(var type in mapCarto) {
        //         for(var prop in mapCarto[type]) {
        //           var propRegex = new RegExp('[ \t]' + regexEscape(prop) + ':(.*?);');
        //           var propMatch = cartocss.match(propRegex);
        //           if(propMatch != null) {
        //             eval('scope.cartoEditor.' + type + '.' + mapCarto[type][prop] + ' = propMatch[1].trim().toLowerCase()');
        //           } else {
        //             eval('scope.cartoEditor.' + type + '.' + mapCarto[type][prop] + ' = "";');
        //           }
        //         }
        //       }
        //     }
        //   }
        // });
      }
    }
  }
])

.directive('rasterStops', [
  function() {
    return {
      restrict: 'EA',
      scope: {
        stopCss: '=ngModel'
      },
      require: 'ngModel',
      templateUrl: '/views/view/raster-stops.html',
      link: function(scope, element, attrs) {
        scope.stops = [];
        scope.addStop = function() {
          scope.stops.push({
            pos: 0,
            color: '#ffffff'
          });
        };
        scope.$watch('stops', function() {
          console.log('updated stops');
          var css = '';
          scope.stops.forEach(function(stop) {
            css += 'stop(' + stop.pos + ', ' + stop.color + ') ';
          });
          css = css.trim();
          scope.stopCss = css;
        }, true);
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
            return column.type == 'esriFieldTypeString';
          });
        } else if(type == 'choropleth') {
          input = _.filter(input, function(column) {
            return column.type == 'esriFieldTypeInteger' || column.type == 'esriFieldTypeDouble';
          });
        }
      }
      return input;
    }
  }
])
