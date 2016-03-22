angular.module('domegis')

.directive('uiSpinner', [
  function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        step: '=',
        max: '=',
        min: '='
      },
      link: function(scope, element, attrs, c) {
        element.spinner({
          step: scope.step || 1,
          max: scope.max,
          min: scope.min,
          spin: function(event, ui) {
            c.$setViewValue(ui.value);
          }
        });
      }
    }
  }
]);
