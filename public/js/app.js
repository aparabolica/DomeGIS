angular.module('domegis', [
  'ui.router',
  'ui.ace',
  'colorpicker.module'
]);

angular.element(document).ready(function() {
  angular.bootstrap(document, ['domegis']);
});
