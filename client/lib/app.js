angular.module('domegis', [
  'ui.router',
  'angular-meteor',
  'ui.ace',
  'colorpicker.module'
]);

angular.element(document).ready(function() {
  angular.bootstrap(document, ['domegis']);
});
